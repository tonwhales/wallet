import { memo, useCallback, useMemo } from "react";
import { View, Text, useWindowDimensions, Pressable, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useAccountLite, useCloudValue, useDisplayableJettons, useExtraCurrencyHints, useHintsFull, useHoldersAccounts, useHoldersAccountStatus, useNetwork, useSelectedAccount, useSolanaSelectedAccount, useTheme } from "../../engine/hooks";
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
import { ReceiveableTonAsset } from "./ReceiveFragment";
import { getAccountName } from "../../utils/holders/getAccountName";
import { HoldersAccountItem, HoldersItemContentType } from "../../components/products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { hasDirectTonDeposit } from "../../utils/holders/hasDirectDeposit";
import { getSpecialJetton } from "../../secure/KnownWallets";
import { ExtraCurrencyHint } from "../../engine/api/fetchExtraCurrencyHints";
import { SimpleTransferAsset } from "../secure/simpleTransfer/hooks/useSimpleTransfer";
import { ExtraCurrencyProductItem } from "../../components/products/ExtraCurrencyProductItem";

import IcCheck from "@assets/ic-check.svg";

type ListItem =
    { type: 'jetton', hint: JettonFull }
    | { type: 'extraCurrency', currency: ExtraCurrencyHint }
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
    simpleTransferAssetCallback?: (selected?: SimpleTransferAsset) => void,
    assetCallback?: (selected: ReceiveableTonAsset | null) => void,
    selectedAsset?: SimpleTransferAsset | null,
    viewType: AssetViewType,
    isLedger?: boolean
}

export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const solanaAddress = useSolanaSelectedAccount()!;
    const [disabledState] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const { target, simpleTransferAssetCallback, assetCallback, selectedAsset, viewType, includeHolders, isLedger } = useParams<AssetsFragmentParams>();

    const title = viewType === AssetViewType.Receive
        ? t('receive.assets')
        : t('products.accounts');

    const route = useRoute();
    const routeName = route.name;
    const isJettonsReceiveRoute = routeName === 'ReceiveAssetsJettons';

    const ledgerTransport = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (isLedger && !!ledgerTransport?.addr) {
            return Address.parse(ledgerTransport.addr.address);
        }
    }, [ledgerTransport, isLedger]);

    const owner = isLedger ? ledgerAddress! : selected!.address;
    const savings = useDisplayableJettons(owner.toString({ testOnly: isTestnet })).savings || [];
    const holdersAccStatus = useHoldersAccountStatus(owner).data;
    const holdersAccounts = useHoldersAccounts(owner, isLedger ? undefined : solanaAddress).data?.accounts?.filter(acc => hasDirectTonDeposit(acc)) ?? [];
    const account = useAccountLite(owner);
    const hints = useHintsFull(owner.toString({ testOnly: isTestnet })).data?.hints ?? [];
    const extraCurrencies = useExtraCurrencyHints(owner.toString({ testOnly: isTestnet })).data ?? [];

    const itemsList = useMemo(() => {
        const filtered: ListItem[] = hints
            .filter((j) => {
                if (isLedger) {
                    return true;
                }

                const isSpecial = getSpecialJetton(isTestnet) === j.jetton.address
                const isSavings = savings.some((s) => s.jetton.address === j.jetton.address);

                if (isJettonsReceiveRoute && isSpecial) {
                    return false;
                }
                if (isSavings || isSpecial) {
                    return true;
                }

                return !disabledState.disabled[j.jetton.address];
            })
            .map((h) => ({
                type: 'jetton',
                hint: h
            }));

        const extraCurrenciesList: ListItem[] = extraCurrencies.map((c) => ({
            type: 'extraCurrency',
            currency: c
        }));

        const holders: ListItem[] = includeHolders ? holdersAccounts.map((h) => ({
            type: 'holders',
            account: h
        })) : [];

        let items: ListItem[] = [...holders, ...extraCurrenciesList, ...filtered];

        if (!isJettonsReceiveRoute) {
            items = [{ type: 'ton' }, ...items];
        }

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

        return items;
    }, [disabledState, isTestnet, isLedger, hints, holdersAccounts, includeHolders, savings, isJettonsReceiveRoute, extraCurrencies]);

    const onJettonCallback = useCallback((selected?: SimpleTransferAsset) => {
        if (simpleTransferAssetCallback) {
            setTimeout(() => {
                navigation.goBack();
                simpleTransferAssetCallback(selected);
            }, 10);
        }
    }, [simpleTransferAssetCallback]);

    const onAssetCallback = useCallback((selected: ReceiveableTonAsset | null) => {
        if (assetCallback) {
            setTimeout(() => {
                navigation.goBack();
                assetCallback(selected);
            }, 10);
        }
    }, [assetCallback]);

    const onJettonSelected = useCallback((hint: JettonFull) => {
        if (simpleTransferAssetCallback) {
            onJettonCallback({
                type: 'jetton',
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

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            comment: null,
            asset: {
                type: 'jetton',
                master: Address.parse(hint.jetton.address),
                wallet: Address.parse(hint.walletAddress.address)
            },
            stateInit: null,
            callback: null
        }, { ledger: isLedger, replace: isLedger });
    }, [onJettonCallback, onAssetCallback, isLedger]);

    const onExtraCurrencySelected = useCallback((currency: ExtraCurrencyHint) => {
        if (simpleTransferAssetCallback) {
            setTimeout(() => {
                navigation.goBack();
                simpleTransferAssetCallback({ type: 'extraCurrency', id: currency.preview.id });
            }, 10);
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            comment: null,
            asset: { type: 'extraCurrency', id: currency.preview.id },
            stateInit: null,
            callback: null,
            extraCurrencyId: currency.preview.id
        }, { ledger: isLedger, replace: isLedger });
    }, [simpleTransferAssetCallback, isLedger]);

    const onTonSelected = useCallback(() => {
        if (simpleTransferAssetCallback) {
            onJettonCallback();
            return;
        } else if (assetCallback) {
            onAssetCallback(null);
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            stateInit: null,
            comment: null,
            asset: null,
            callback: null
        }, { ledger: isLedger, replace: isLedger });
    }, [isLedger, onJettonCallback, onAssetCallback]);

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

        if (isLedger && !target.address) {
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: target.address,
            comment: null,
            asset: null,
            stateInit: null,
            callback: null
        }, { ledger: isLedger, replace: isLedger });
    }, [onJettonCallback, onAssetCallback, isTestnet, isLedger]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        switch (item.type) {
            case 'holders':
                let isSelected = false;

                if (item.account.address) {
                    try {
                        if (selectedAsset?.type === 'address') {
                            isSelected = selectedAsset.address.equals(Address.parse(item.account.address));
                        }
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
                        content={{ type: HoldersItemContentType.SELECT, isSelected }}
                    />
                );
            case 'jetton':
                return (
                    <AssetsListItem
                        hint={item.hint}
                        owner={owner}
                        onSelect={onJettonSelected}
                        hideSelection={!simpleTransferAssetCallback && !assetCallback}
                        selected={selectedAsset?.type === 'jetton' ? selectedAsset.master : null}
                        isTestnet={isTestnet}
                        theme={theme}
                        jettonViewType={viewType}
                    />
                );
            case 'extraCurrency':
                return (
                    <ExtraCurrencyProductItem
                        card
                        currency={item.currency}
                        owner={owner}
                        selectParams={{
                            onSelect: onExtraCurrencySelected,
                            selectedFn: (currency) => selectedAsset?.type === 'extraCurrency' && selectedAsset.id === currency.preview.id
                        }}
                        selected={selectedAsset?.type === 'extraCurrency' && selectedAsset.id === item.currency.preview.id}
                        jettonViewType={viewType}
                        itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                    />
                );
            default:
                return (
                    <TonAssetItem
                        balance={account?.balance ?? 0n}
                        onTonSelected={onTonSelected}
                        selectable={!!simpleTransferAssetCallback || !!assetCallback}
                        isSelected={!selectedAsset || (selectedAsset.type === 'address' && selectedAsset.address.equals(owner))}
                        viewType={viewType}
                    />
                );
        }
    }, [
        selectedAsset, owner, isTestnet, theme, viewType, account?.balance, owner, holdersAccStatus,
        onJettonSelected, onTonSelected, onHoldersSelected, onExtraCurrencySelected
    ]);

    const renderSectionHeader = useCallback(({ section }: { section: { type: string, data: ListItem[] } }) => {
        if (section.type === 'ton') {
            return null;
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
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={assetCallback ? navigation.popToTop : undefined}
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