import { useCallback } from "react";
import { View, Text, Pressable, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useBounceableWalletFormat, useCurrentAddress, useDisplayableJettons, useHoldersAccounts, useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSolanaTokens, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { Typography } from "../../components/styles";
import { Image } from "expo-image";
import { ReceiveableTonAsset } from "./ReceiveFragment";
import { HoldersAccountItem, HoldersItemContentType } from "../../components/products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { SpecialJettonProduct } from "../../components/products/savings/SpecialJettonProduct";
import { AssetViewType } from "./AssetsFragment";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParams, HoldersAppParamsType } from "../holders/HoldersAppFragment";
import { useAppMode } from "../../engine/hooks/appstate/useAppMode";
import { SolanaWalletProduct } from "../../components/products/savings/SolanaWalletProduct";
import { SolanaTokenProduct } from "../../components/products/savings/SolanaTokenProduct";
import { SolanaToken } from "../../engine/api/solana/fetchSolanaTokens";
import { ChangellyBanner } from "../../components/products/ChangellyBanner";
import { AssetType } from "../../engine/types/deposit";
import { TonProductComponent } from "../../components/products/savings/TonWalletProduct";

type ListItem = { type: AssetType.OTHERCOINS }
    | { type: AssetType.SPECIAL }
    | { type: AssetType.HOLDERS, account: GeneralHoldersAccount }
    | { type: AssetType.TON }
    | { type: AssetType.SPECIAL }
    | { type: AssetType.SOLANA }
    | { type: AssetType.SOLANA_TOKEN, token: SolanaToken };

export type ReceiveAssetsFragment = {
    assetCallback?: (selected: ReceiveableTonAsset | null) => void,
    title: string
}

export const ReceiveAssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const { tonAddress, solanaAddress, isLedger } = useCurrentAddress()
    const { assetCallback, title } = useParams<ReceiveAssetsFragment>();
    const ledgerContext = useLedgerTransport();
    const [bounceableFormat] = useBounceableWalletFormat();
    const tokens = useSolanaTokens(solanaAddress!, isLedger);
    const holdersAccStatus = useHoldersAccountStatus(tonAddress).data;
    const holdersAccounts = useHoldersAccounts(tonAddress, isLedger ? undefined : solanaAddress).data?.accounts ?? [];
    const hints = useDisplayableJettons(tonAddress.toString({ testOnly: isTestnet }));
    const showOtherCoins = hints.jettonsList.length > 0 || hints.savings.length > 0;
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;
    const [isWalletMode] = useAppMode(tonAddress);

    const onAssetCallback = useCallback((asset: ReceiveableTonAsset | null) => {
        if (assetCallback) {
            setTimeout(() => {
                navigation.goBack();
                assetCallback(asset);
            }, 10);
        } else {
            navigation.navigateReceive({ addr: tonAddress.toString({ testOnly: isTestnet, bounceable: isLedger ? false : bounceableFormat }), asset: asset || undefined }, isLedger);
        }
    }, [assetCallback, isLedger, tonAddress, isTestnet, bounceableFormat]);

    const onHoldersSelected = useCallback((target: GeneralHoldersAccount) => {
        let path = `/account/${target.id}?deposit-open=true`;
        const navParams: HoldersAppParams = { type: HoldersAppParamsType.Path, path, query: {} };

        navigation.goBack();

        if (needsEnrollment || !isHoldersReady) {
            if (isLedger && (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport)) {
                ledgerContext.onShowLedgerConnectionError();
                return;
            }
            navigation.navigateHoldersLanding(
                { endpoint: url, onEnrollType: navParams, isLedger },
                isTestnet
            );
            return;
        }

        navigation.navigateHolders(navParams, isTestnet, isLedger);
    }, [needsEnrollment, isHoldersReady, isTestnet, isLedger, ledgerContext]);

    const onWarningClick = useCallback(() => {
        const navParams: HoldersAppParams = { type: HoldersAppParamsType.Create };
        navigation.goBack();

        if (needsEnrollment || !isHoldersReady) {
            if (isLedger && (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport)) {
                ledgerContext.onShowLedgerConnectionError();
                return;
            }
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: navParams, isLedger }, isTestnet);
            return;
        }

        navigation.navigateHolders(navParams, isTestnet, isLedger);
    }, [needsEnrollment, isHoldersReady, isTestnet, isLedger, ledgerContext, url]);

    const solanaTokens: SolanaToken[] = tokens?.data ?? [];

    const openSolanaToken = useCallback((token: SolanaToken) => {
        if (!solanaAddress) {
            return;
        }
        navigation.navigateSolanaReceive({
            addr: solanaAddress,
            asset: {
                mint: token.address,
                content: {
                    icon: token.logoURI,
                    name: token.name
                }
            }
        });
    }, [navigation, solanaAddress]);

    const openSolanaWallet = useCallback(() => {
        if (!solanaAddress) {
            return;
        }
        navigation.navigateSolanaReceive({ addr: solanaAddress });
    }, [navigation, solanaAddress]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        switch (item.type) {
            case AssetType.HOLDERS:
                return (
                    <HoldersAccountItem
                        owner={tonAddress}
                        account={item.account}
                        itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                        style={{ paddingVertical: 0 }}
                        isTestnet={isTestnet}
                        hideCardsIfEmpty
                        holdersAccStatus={holdersAccStatus}
                        onOpen={() => onHoldersSelected(item.account)}
                        content={{ type: HoldersItemContentType.NAVIGATION }}
                        onWarningClick={onWarningClick}
                    />
                );
            case AssetType.SPECIAL:
                return (
                    <SpecialJettonProduct
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        address={tonAddress}
                        testOnly={isTestnet}
                        assetCallback={onAssetCallback}
                    />
                );
            case AssetType.OTHERCOINS:
                const navigate = () => navigation.navigateReceiveAssetsJettons({
                    assetCallback: onAssetCallback,
                    viewType: AssetViewType.Receive,
                    includeHolders: false,
                    isLedger,
                    hideSelection: true,
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
            case AssetType.SOLANA:
                return solanaAddress ? (
                    <SolanaWalletProduct
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        address={solanaAddress}
                        onSelect={openSolanaWallet}
                    />
                ) : null;
            case AssetType.SOLANA_TOKEN:
                return solanaAddress ? (
                    <SolanaTokenProduct
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        token={item.token}
                        address={solanaAddress}
                        onSelect={() => openSolanaToken(item.token)}
                    />
                ) : null;
            default:
                return (
                    <TonProductComponent
                        theme={{ ...theme, surfaceOnBg: theme.surfaceOnElevation }}
                        address={tonAddress}
                        testOnly={isTestnet}
                        onSelect={() => onAssetCallback(null)}
                        isLedger={isLedger}
                    />
                );
        }
    }, [
        tonAddress, isTestnet, theme, holdersAccStatus, isLedger,
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

        if (section.type === 'otherCoins') {
            return (
                <Text style={[{ color: theme.textPrimary, marginVertical: 16 }, Typography.semiBold20_28]}>
                    {t('jetton.productButtonTitle')}
                </Text>
            );
        }

        return (
            <Text style={[{ color: theme.textPrimary, marginVertical: 16 }, Typography.semiBold20_28]}>
                {t('products.savings')}
            </Text>
        );
    }, [theme, holdersAccounts.length]);

    const defaultSection: { type: 'default' | 'holders', data: ListItem[] } = {
        type: 'default',
        data: [
            { type: AssetType.TON },
            { type: AssetType.SPECIAL },
            { type: AssetType.SOLANA },
            ...solanaTokens.map((t) => ({
                type: AssetType.SOLANA_TOKEN as AssetType.SOLANA_TOKEN, // wtf, typescript?
                token: t
            }))
        ]
    };

    let itemsList: { type: 'default' | 'holders' | 'otherCoins', data: ListItem[] }[] = []

    if (!isWalletMode) {
        itemsList.push(
            {
                type: 'holders',
                data: holdersAccounts.map((account) => ({ account, type: AssetType.HOLDERS }))
            })
    } else {
        itemsList.push(defaultSection)

        if (showOtherCoins) {
            itemsList.push({ type: 'otherCoins', data: [{ type: AssetType.OTHERCOINS }] });
        }
    }

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
                ListHeaderComponent={() => <ChangellyBanner
                    onPress={() => navigation.navigateSwap()}
                    theme={theme}
                />}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                keyExtractor={(item, index) => `jetton-i-${index}`}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
        </View>
    );
});