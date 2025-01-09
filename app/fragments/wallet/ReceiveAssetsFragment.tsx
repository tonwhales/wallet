import { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useDisplayableJettons, useHoldersAccounts, useHoldersAccountStatus, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { Typography } from "../../components/styles";
import { Image } from "expo-image";
import { ReceiveableAsset } from "./ReceiveFragment";
import { getAccountName } from "../../utils/holders/getAccountName";
import { HoldersAccountItem, HoldersItemContentType } from "../../components/products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { hasDirectDeposit } from "../../utils/holders/hasDirectDeposit";
import { SpecialJettonProduct } from "../../components/products/SpecialJettonProduct";
import { AssetViewType } from "./AssetsFragment";

enum AssetType {
    TON = 'ton',
    HOLDERS = 'holders',
    SPECIAL = 'special',
    OTHERCOINS = 'otherCoins'
}

type ListItem = { type: AssetType.OTHERCOINS }
    | { type: AssetType.SPECIAL }
    | { type: AssetType.HOLDERS, account: GeneralHoldersAccount }
    | { type: AssetType.TON }
    | { type: AssetType.SPECIAL };

const TonAssetItem = memo(({ onSelect }: { onSelect: () => void }) => {
    const theme = useTheme();

    return (
        <View style={{ height: 86 }}>
            <Pressable
                style={{
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 20,
                    marginBottom: 16,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
                onPress={onSelect}
            >
                <View style={{ width: 46, height: 46 }}>
                    <Image
                        source={require('@assets/ic-ton-acc.png')}
                        style={{ height: 46, width: 46 }}
                    />
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 20, width: 20, borderRadius: 10,
                        position: 'absolute', right: -2, bottom: -2,
                        backgroundColor: theme.surfaceOnBg
                    }}>
                        <Image
                            source={require('@assets/ic-verified.png')}
                            style={{ height: 20, width: 20 }}
                        />
                    </View>
                </View>
                <View style={{ justifyContent: 'center', flexGrow: 1, flex: 1, marginLeft: 12 }}>
                    <Text style={[{ flexShrink: 1, color: theme.textPrimary }, Typography.semiBold17_24]}>
                        {'Toncoin'}
                    </Text>
                    <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                        {'TON'}
                    </Text>
                </View>
                <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                    <Image
                        source={require('@assets/ic-chevron-right.png')}
                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                    />
                </View>
            </Pressable>
        </View>
    );
});

export type ReceiveAssetsFragment = {
    assetCallback?: (selected: ReceiveableAsset | null) => void,
    title: string
}

export const ReceiveAssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const route = useRoute();
    const isLedger = route.name === 'LedgerReceiveAssets';
    const { assetCallback, title } = useParams<ReceiveAssetsFragment>();
    const ledgerTransport = useLedgerTransport();

    const ledgerAddress = useMemo(() => {
        if (isLedger && !!ledgerTransport?.addr) {
            return Address.parse(ledgerTransport.addr.address);
        }
    }, [ledgerTransport, isLedger]);

    const owner = isLedger ? ledgerAddress! : selected!.address;
    const holdersAccStatus = useHoldersAccountStatus(owner).data;
    const holdersAccounts = useHoldersAccounts(owner).data?.accounts?.filter(acc => hasDirectDeposit(acc)) ?? [];
    const hints = useDisplayableJettons(owner.toString({ testOnly: isTestnet }));
    const showOtherCoins = hints.jettonsList.length > 0 || hints.savings.length > 0;

    const onAssetCallback = useCallback((asset: ReceiveableAsset | null) => {
        if (assetCallback) {
            setTimeout(() => {
                navigation.goBack();
                assetCallback(asset);
            }, 10);
        } else {
            navigation.navigateReceive({ asset: asset || undefined, ledger: isLedger });
        }
    }, [assetCallback, isLedger]);

    const onHoldersSelected = useCallback((target: GeneralHoldersAccount) => {
        if (!target.address) {
            return;
        }

        const name = getAccountName(target.accountIndex, target.name);

        onAssetCallback({
            address: Address.parse(target.address),
            content: { icon: null, name },
            holders: target
        });
    }, [onAssetCallback, isTestnet]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        switch (item.type) {
            case AssetType.HOLDERS:
                return (
                    <HoldersAccountItem
                        owner={owner}
                        account={item.account}
                        itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                        style={{ paddingVertical: 0 }}
                        isTestnet={isTestnet}
                        hideCardsIfEmpty
                        holdersAccStatus={holdersAccStatus}
                        onOpen={() => onHoldersSelected(item.account)}
                        content={{ type: HoldersItemContentType.NAVIGATION }}
                    />
                );
            case AssetType.SPECIAL:
                return (
                    <SpecialJettonProduct
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        address={owner}
                        testOnly={isTestnet}
                        assetCallback={onAssetCallback}
                    />
                );
            case AssetType.OTHERCOINS:
                const navigate = () => navigation.navigateReceiveAssetsJettons({
                    assetCallback: onAssetCallback,
                    viewType: AssetViewType.Receive,
                    includeHolders: false,
                    isLedger
                });

                return (
                    <Pressable
                        onPress={navigate}
                        style={({ pressed }) => ([{ opacity: pressed ? 0.8 : 1 }])}
                    >
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            padding: 20,
                            marginBottom: 16,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <View style={{
                                width: 46, height: 46,
                                justifyContent: 'center', alignItems: 'center',
                                borderRadius: 23,
                                backgroundColor: theme.accent
                            }}>
                                <Image
                                    source={require('@assets/ic-dots.png')}
                                    style={{ height: 24, width: 24 }}
                                />
                            </View>
                            <View style={{ justifyContent: 'center', flexGrow: 1, flex: 1, marginLeft: 12 }}>
                                <Text style={[{ flexShrink: 1, color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {t('receive.otherCoins')}
                                </Text>
                            </View>
                            <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                                <Image
                                    source={require('@assets/ic-chevron-right.png')}
                                    style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                                />
                            </View>
                        </View>
                    </Pressable>
                );
            default:
                const tonCallback = () => onAssetCallback(null);
                return (<TonAssetItem onSelect={tonCallback} />);
        }
    }, [
        owner, isTestnet, theme, owner, holdersAccStatus, isLedger,
        onHoldersSelected, onAssetCallback
    ]);

    const renderSectionHeader = useCallback(({ section }: { section: { type: string, data: ListItem[] } }) => {
        if (section.type === 'ton') {
            return null;
        }

        if (section.type === 'holders') {
            if (!holdersAccounts.length) {
                return null;
            }
            return (
                <Text style={[{ color: theme.textPrimary, marginVertical: 16 }, Typography.semiBold20_28]}>
                    {t('products.holders.accounts.title')}
                </Text>
            );
        }

        return (
            <Text style={[{ color: theme.textPrimary, marginVertical: 16 }, Typography.semiBold20_28]}>
                {t('products.accounts')}
            </Text>
        );
    }, [theme, holdersAccounts.length]);

    const defaultSection: { type: 'default' | 'holders', data: ListItem[] } = {
        type: 'default',
        data: [{ type: AssetType.TON }, { type: AssetType.SPECIAL }]
    };

    if (showOtherCoins) {
        defaultSection.data.push({ type: AssetType.OTHERCOINS });
    }

    const itemsList: { type: 'default' | 'holders', data: ListItem[] }[] = [
        defaultSection,
        {
            type: 'holders',
            data: holdersAccounts.map((account) => ({ account, type: AssetType.HOLDERS }))
        }
    ];

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={title}
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={navigation.goBack}
            />
            <SectionList
                sections={itemsList as { type: 'default' | 'holders', data: ListItem[] }[]}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                removeClippedSubviews={true}
                stickySectionHeadersEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                keyExtractor={(item, index) => `jetton-i-${index}`}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
        </View>
    );
});