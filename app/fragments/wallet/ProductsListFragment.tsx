import { useRoute } from "@react-navigation/native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useHoldersAccountStatus, useHoldersAccounts, useJettons, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { useMemo } from "react";
import { Address } from "@ton/core";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { HoldersAccountItem } from "../../components/products/HoldersAccountItem";
import { HoldersPrepaidCard } from "../../components/products/HoldersPrepaidCard";
import { JettonProductItem } from "../../components/products/JettonProductItem";
import { Jetton } from "../../engine/types";
import { GeneralHoldersAccount, PrePaidHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ProductsListFragmentParams = {
    type: 'holders-accounts' | 'holders-cards' | 'jettons',
    isLedger?: boolean
};

export const ProductsListFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { type } = useParams<ProductsListFragmentParams>();
    const isLedger = useRoute().name === 'LedgerProductsList';
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
    const jettons = useJettons(addressStr);

    const items = useMemo<{
        data: (GeneralHoldersAccount | PrePaidHoldersCard | Jetton)[],
        renderItem: ({ item }: { item: any }) => any,
        estimatedItemSize: number
    }>(() => {
        if (type === 'holders-accounts') {
            return {
                data: holdersAccounts?.accounts ?? [],
                renderItem: ({ item }: { item: GeneralHoldersAccount }) => {
                    return (
                        <HoldersAccountItem
                            account={item}
                            isTestnet={testOnly}
                            holdersAccStatus={holdersAccStatus}
                        />
                    );
                },
                estimatedItemSize: 122
            };
        } else if (type === 'holders-cards') {
            return {
                data: holdersAccounts?.prepaidCards ?? [],
                renderItem: ({ item }: { item: PrePaidHoldersCard }) => {
                    return (
                        <HoldersPrepaidCard
                            card={item}
                            style={{ paddingVertical: 0 }}
                            isTestnet={testOnly}
                            holdersAccStatus={holdersAccStatus}
                        />
                    );
                },
                estimatedItemSize: 84
            };
        } else {
            return {
                data: jettons ?? [],
                renderItem: ({ item }: { item: Jetton }) => {
                    return (
                        <JettonProductItem
                            jetton={item}
                            card
                            itemStyle={{
                                backgroundColor: theme.surfaceOnElevation
                            }}
                            last
                        />
                    );
                },
                estimatedItemSize: 86
            };
        }
    }, [holdersAccounts, holdersAccStatus, jettons]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                style={{ paddingHorizontal: 16 }}
                onBackPressed={navigation.goBack}
                title={type === 'holders-accounts' ? 'Holders Accounts' : type === 'holders-cards' ? 'Holders Cards' : 'Jettons'}
            />
            <FlashList
                data={items.data as any}
                renderItem={items.renderItem}
                estimatedItemSize={items.estimatedItemSize}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentInset={{ bottom: safeArea.bottom + 16 }}
            />
        </View>
    );
});