import { memo, useCallback, useMemo } from "react";
import { View, Text, useWindowDimensions, Pressable, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useAccountLite, useCloudValue, useHintsFull, useHoldersAccounts, useHoldersAccountStatus, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { AssetsListItem } from "../../components/jettons/AssetsListItem";
import { FlashList } from "@shopify/flash-list";
import { Typography } from "../../components/styles";
import { Image } from "expo-image";
import { JettonFull } from "../../engine/api/fetchHintsFull";
import { ValueComponent } from "../../components/ValueComponent";
import { ReceiveableAsset } from "./ReceiveFragment";
import { getAccountName } from "../../utils/holders/getAccountName";
import { HoldersAccountItem } from "../../components/products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { hasDirectDeposit } from "../../utils/holders/hasDirectDeposit";

import IcCheck from "@assets/ic-check.svg";

type ListItem =
    { type: 'jetton', hint: JettonFull }
    | { type: 'ton' }
    | { type: 'holders', account: GeneralHoldersAccount };

export enum AssetViewType {
    Transfer = 'transfer',
    Receive = 'receive',
    Default = 'default'
}

const TonAssetItem = memo((params: {
    onTonSelected: () => void,
    balance: bigint,
    selectable: boolean,
    isSelected: boolean
    viewType: AssetViewType
}) => {
    const { onTonSelected, balance, selectable, isSelected, viewType } = params;
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
                onPress={onTonSelected}
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
                    {viewType !== AssetViewType.Receive && (
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            <ValueComponent
                                value={balance}
                                precision={2}
                                suffix={' TON'}
                                centFontStyle={{ color: theme.textSecondary }}
                                forcePrecision
                            />
                        </Text>
                    )}
                </View>
                {!!selectable && (
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: isSelected ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {isSelected && (
                            <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                        )}
                    </View>
                )}
            </Pressable>
        </View>
    );
});

export type AssetsFragmentParams = {
    target?: string,
    includeHolders?: boolean,
    jettonCallback?: (selected?: { wallet?: Address, master: Address }) => void,
    assetCallback?: (selected: ReceiveableAsset | null) => void,
    selectedAsset?: Address | null,
    viewType: AssetViewType
}

export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const [disabledState] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const { target, jettonCallback, assetCallback, selectedAsset, viewType, includeHolders } = useParams<AssetsFragmentParams>();

    const title = viewType === AssetViewType.Receive
        ? t('receive.assets')
        : t('products.accounts');

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
    const account = useAccountLite(owner);
    const hints = useHintsFull(owner.toString({ testOnly: isTestnet })).data?.hints ?? [];

    const itemsList = useMemo(() => {
        const filtered: ListItem[] = hints
            .filter((j) => !disabledState.disabled[j.jetton.address] || isLedgerScreen)
            .map((h) => ({
                type: 'jetton',
                hint: h
            }));

        const holders: ListItem[] = includeHolders ? holdersAccounts.map((h) => ({
            type: 'holders',
            account: h
        })) : [];

        const items: ListItem[] = [{ type: 'ton' }, ...holders, ...filtered];
        const sectioned = new Map<string, { type: string, data: ListItem[] }>();

        if (includeHolders) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type === 'ton') {
                    sectioned.set('ton', { type: 'ton', data: [item] });
                    continue;
                }

                const key = item.type === 'holders' ? 'holders' : 'jetton';
                if (!sectioned.has(key)) {
                    sectioned.set(key, { type: key, data: [] });
                }
                sectioned.get(key)?.data.push(item);
            }

            return Array.from(sectioned.values())
        }

        return [{ type: 'ton' }, ...holders, ...filtered] as ListItem[];
    }, [disabledState, isTestnet, isLedgerScreen, hints, holdersAccounts, includeHolders]);

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
            case 'holders':
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
            case 'jetton':
                return (
                    <AssetsListItem
                        hint={item.hint}
                        owner={owner}
                        onSelect={onJettonSelected}
                        hideSelection={!jettonCallback && !assetCallback}
                        selected={selectedAsset}
                        isTestnet={isTestnet}
                        theme={theme}
                        jettonViewType={viewType}
                    />
                );
            default:
                return (
                    <TonAssetItem
                        balance={account?.balance ?? 0n}
                        onTonSelected={onTonSelected}
                        selectable={!!jettonCallback || !!assetCallback}
                        isSelected={!selectedAsset || (selectedAsset === owner)}
                        viewType={viewType}
                    />
                );
        }
    }, [
        selectedAsset, owner, isTestnet, theme, viewType, account?.balance, owner, holdersAccStatus,
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
            {includeHolders ? (
                <SectionList
                    sections={itemsList as { type: string, data: ListItem[] }[]}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    removeClippedSubviews={true}
                    stickySectionHeadersEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    contentInset={{ bottom: safeArea.bottom + 16 }}
                    keyExtractor={(item, index) => `jetton-i-${index}`}
                    ListEmptyComponent={(
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: dimentions.height - (safeArea.bottom + safeArea.top + 44 + 32 + 32),
                            width: '100%',
                        }}>
                            <Text style={[Typography.semiBold27_32, { color: theme.textSecondary }]}>
                                {t('jetton.jettonsNotFound')}
                            </Text>
                        </View>
                    )}
                    ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
                />
            ) : (
                <FlashList
                    data={itemsList as ListItem[]}
                    renderItem={renderItem}
                    // to see less blank space
                    estimatedItemSize={80}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    contentInset={{ bottom: safeArea.bottom + 16 }}
                    keyExtractor={(item, index) => `jetton-i-${index}`}
                    ListEmptyComponent={(
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: dimentions.height - (safeArea.bottom + safeArea.top + 44 + 32 + 32),
                            width: '100%',
                        }}>
                            <Text style={[Typography.semiBold27_32, { color: theme.textSecondary }]}>
                                {t('jetton.jettonsNotFound')}
                            </Text>
                        </View>
                    )}
                    ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
                />
            )}
        </View>
    );
});