import { useRoute } from "@react-navigation/native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useHoldersAccountStatus, useHoldersAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Suspense, memo, useMemo } from "react";
import { Address } from "@ton/core";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { HoldersAccountItem } from "../../components/products/HoldersAccountItem";
import { HoldersPrepaidCard } from "../../components/products/HoldersPrepaidCard";
import { GeneralHoldersAccount, PrePaidHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../i18n/t";
import { JettonsList } from "../../components/products/JettonsList";

export type ProductsListFragmentParams = {
    type: 'holders-accounts' | 'holders-cards' | 'jettons',
    isLedger?: boolean
};

const ProductsListComponent = memo(({ type, isLedger }: { type: 'holders-accounts' | 'holders-cards', isLedger: boolean }) => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();

    const addressStr = useMemo(() => {
        if (isLedger && ledgerContext?.addr?.address) {
            try {
                return Address.parse(ledgerContext.addr.address).toString({ testOnly });
            } catch {
                return '';
            }
        }
        return selected!.address.toString({ testOnly });
    }, [selected, ledgerContext, testOnly]);

    const holdersAccounts = useHoldersAccounts(addressStr).data;
    const holdersAccStatus = useHoldersAccountStatus(addressStr).data;

    const items = useMemo<{
        data: (GeneralHoldersAccount | PrePaidHoldersCard)[],
        renderItem: ({ item, index }: { item: any, index: number }) => any,
        estimatedItemSize: number
    }>(() => {
        if (type === 'holders-accounts') {
            return {
                data: holdersAccounts?.accounts ?? [],
                renderItem: ({ item, index }: { item: GeneralHoldersAccount, index: number }) => {
                    return (
                        <HoldersAccountItem
                            key={`${item.id}-${index}`}
                            account={item}
                            isTestnet={testOnly}
                            holdersAccStatus={holdersAccStatus}
                            itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                            onBeforeOpen={navigation.goBack}
                        />
                    );
                },
                estimatedItemSize: 122
            };
        } else {
            return {
                data: holdersAccounts?.prepaidCards ?? [],
                renderItem: ({ item, index }: { item: PrePaidHoldersCard, index: number }) => {
                    return (
                        <HoldersPrepaidCard
                            key={`${item.id}-${index}`}
                            card={item}
                            style={{ paddingVertical: 0 }}
                            isTestnet={testOnly}
                            holdersAccStatus={holdersAccStatus}
                            itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                            onBeforeOpen={navigation.goBack}
                        />
                    );
                },
                estimatedItemSize: 84
            };
        }
    }, [holdersAccounts, holdersAccStatus]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                style={{ paddingHorizontal: 16 }}
                onBackPressed={navigation.goBack}
                title={type === 'holders-cards' ? t('products.holders.accounts.prepaidTitle') : t('products.holders.accounts.title')}
            />
            <FlashList
                data={items.data as any}
                renderItem={items.renderItem}
                estimatedItemSize={items.estimatedItemSize}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentInset={{ bottom: safeArea.bottom + 16, top: 16 }}
                keyExtractor={(item, index) => `${type}-${index}`}
            />
        </View>
    )
});

export const ProductsListFragment = fragment(() => {
    const { type } = useParams<ProductsListFragmentParams>();
    const isLedger = useRoute().name === 'LedgerProductsList';

    return (
        <View style={{ flexGrow: 1 }}>
            {type === 'jettons' ? (
                <Suspense fallback={<View style={{ backgroundColor: 'red', height: 500, width: 500 }} />}>
                    <JettonsList isLedger={isLedger} />
                </Suspense>
            ) : (
                <ProductsListComponent type={type} isLedger={isLedger} />
            )}
        </View>
    );
});