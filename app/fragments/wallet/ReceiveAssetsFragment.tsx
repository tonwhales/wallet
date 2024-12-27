import { memo, useCallback, useMemo } from "react";
import { View, Text, useWindowDimensions, Pressable, SectionList } from "react-native";
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
import { JettonFull } from "../../engine/api/fetchHintsFull";
import { ReceiveableAsset } from "./ReceiveFragment";
import { getAccountName } from "../../utils/holders/getAccountName";
import { HoldersAccountItem } from "../../components/products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { hasDirectDeposit } from "../../utils/holders/hasDirectDeposit";
import { SpecialJettonProduct } from "../../components/products/SpecialJettonProduct";

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
                        {'TON'}
                    </Text>
                </View>
            </Pressable>
        </View>
    );
});

export type ReceiveAssetsFragment = {
    target?: string,
    jettonCallback?: (selected?: { wallet?: Address, master: Address }) => void,
    assetCallback?: (selected: ReceiveableAsset | null) => void,
    selectedAsset?: Address | null
}

export const ReceiveAssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();

    const { target, jettonCallback, assetCallback, selectedAsset } = useParams<ReceiveAssetsFragment>();

    const route = useRoute();
    const isLedgerScreen = route.name === 'LedgerAssets';

    const ledgerTransport = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (isLedgerScreen && !!ledgerTransport?.addr) {
            return Address.parse(ledgerTransport.addr.address);
        }
    }, [ledgerTransport, isLedgerScreen]);

    const owner = isLedgerScreen ? ledgerAddress! : selected!.address;
    const holdersAccStatus = useHoldersAccountStatus(owner).data;
    const holdersAccounts = useHoldersAccounts(owner).data?.accounts?.filter(acc => hasDirectDeposit(acc)) ?? [];
    const hints = useDisplayableJettons(owner.toString({ testOnly: isTestnet }));
    const showOtherCoins = hints.jettonsList.length > 0 || hints.savings.length > 0;

    const onJettonCallback = useCallback((selected?: { wallet?: Address, master: Address }) => {
        if (jettonCallback) {
            setTimeout(() => {
                navigation.goBack();
                jettonCallback(selected);
            }, 10);
        }
    }, [jettonCallback]);

    const onAssetCallback = useCallback((selected: ReceiveableAsset | null) => {
        if (assetCallback) {
            setTimeout(() => {
                navigation.goBack();
                assetCallback(selected);
            }, 10);
        }
    }, [assetCallback]);

    const onJettonSelected = useCallback((hint: JettonFull) => {
        if (jettonCallback) {
            onJettonCallback({
                wallet: Address.parse(hint.walletAddress.address),
                master: Address.parse(hint.jetton.address)
            });
            return;
        } else if (assetCallback) {
            onAssetCallback({
                address: Address.parse(hint.jetton.address),
                content: { icon: hint.jetton.image, name: hint.jetton.name }
            });
            return;
        }

        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                comment: null,
                jetton: Address.parse(hint.walletAddress.address),
                stateInit: null,
                job: null,
                callback: null
            });
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            comment: null,
            jetton: Address.parse(hint.walletAddress.address),
            stateInit: null,
            callback: null
        });
    }, [onJettonCallback, onAssetCallback]);

    const onTonSelected = useCallback(() => {
        if (jettonCallback) {
            onJettonCallback();
            return;
        } else if (assetCallback) {
            onAssetCallback(null);
            return;
        }

        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                stateInit: null,
                comment: null,
                jetton: null,
                callback: null
            });
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            stateInit: null,
            comment: null,
            jetton: null,
            callback: null
        });
    }, [isLedgerScreen, onJettonCallback, onAssetCallback]);

    const onHoldersSelected = useCallback((target: GeneralHoldersAccount) => {
        if (!target.address) {
            return;
        }
        if (assetCallback) {
            const name = getAccountName(target.accountIndex, target.name);

            onAssetCallback({
                address: Address.parse(target.address),
                content: { icon: null, name },
                holders: target
            });
            return;
        }

        if (isLedgerScreen) {
            if (!target.address) {
                return;
            }

            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target.address,
                comment: null,
                jetton: null,
                stateInit: null,
                job: null,
                callback: null
            });
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target.address,
            comment: null,
            jetton: null,
            stateInit: null,
            callback: null
        });
    }, [onJettonCallback, onAssetCallback, isTestnet]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        switch (item.type) {
            case AssetType.HOLDERS:
                let isSelected = false;

                if (item.account.address) {
                    try {
                        isSelected = selectedAsset?.equals(Address.parse(item.account.address)) ?? false;
                    } catch { }
                }

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
                        selectable
                        isSelected={isSelected}
                    />
                );
            case AssetType.SPECIAL:
                return (
                    <SpecialJettonProduct
                        theme={theme}
                        address={address}
                        testOnly={isTestnet}
                        divider={'top'}
                    />
                );
            case AssetType.OTHERCOINS:
                return (
                    <Pressable>

                    </Pressable>
                )
            default:
                return (
                    <TonAssetItem onSelect={onTonSelected} />
                );
        }
    }, [
        selectedAsset, owner, isTestnet, theme, owner, holdersAccStatus,
        onJettonSelected, onTonSelected, onHoldersSelected
    ]);

    const renderSectionHeader = useCallback(({ section }: { section: { type: string, data: ListItem[] } }) => {
        if (section.type === 'ton') {
            return (null);
        } else if (section.type === 'holders') {
            return (
                <Text style={[{ color: theme.textPrimary, marginVertical: 16 }, Typography.semiBold20_28]}>
                    {t('products.holders.accounts.title')}
                </Text>
            );
        } else {
            return (
                <Text style={[{ color: theme.textPrimary, marginVertical: 16 }, Typography.semiBold20_28]}>
                    {t('products.accounts')}
                </Text>
            );
        }
    }, [theme]);

    // showOtherCoins
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
            data: [...holdersAccounts.map((account) => ({ account, type: AssetType.HOLDERS }))]
        }
    ]

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onBackPressed={navigation.goBack}
                title={title}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
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