import { Address, fromNano, toNano } from "@ton/core";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useJetton, useJettonWallet, useKnownJettons, useNetwork, useTheme, useVerifyJetton } from "../../engine/hooks";
import { Platform, View, Text, Pressable, Image } from "react-native";
import { WalletTransactions } from "./views/WalletTransactions";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { memo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { t } from "../../i18n/t";
import { useJettonWalletTransactios } from "../../engine/hooks/transactions/useJettonWalletTransactios";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useJettonSwap } from "../../engine/hooks/jettons/useJettonSwap";
import { JettonMasterState } from "../../engine/metadata/fetchJettonMasterContent";
import { JettonIcon } from "../../components/products/JettonIcon";
import { Typography } from "../../components/styles";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { ReAnimatedCircularProgress } from "../../components/CircularProgress/ReAnimatedCircularProgress";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { PendingTransactions } from "./views/PendingTransactions";

export type JettonWalletFragmentParams = {
    address: string;
    wallet: string;
    isLedger?: boolean;
};

const JettonWalletHeader = memo(({ wallet, owner, fullScreen }: { wallet: string, owner: string, fullScreen?: boolean }) => {
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const jettonWallet = useJettonWallet(wallet);
    const jetton = useJetton({ wallet, owner, master: jettonWallet?.master });

    if (!jetton) { // should never happen
        return null;
    }

    const masterState: JettonMasterState & { address: string } = {
        address: jetton.master.toString({ testOnly: isTestnet }),
        symbol: jetton.symbol,
        name: jetton.name,
        description: jetton.description,
        decimals: jetton.decimals,
        assets: jetton.assets ?? undefined,
        pool: jetton.pool ?? undefined,
        originalImage: jetton.icon,
        image: jetton.icon ? { preview256: jetton.icon, blurhash: '' } : null,
    }

    return (
        <View style={{
            flexDirection: 'row',
            height: 44, width: '100%',
            alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16,
            backgroundColor: theme.backgroundUnchangeable,
            paddingTop: fullScreen ? 0 : 16
        }}>
            <Pressable
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                    height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                    borderRadius: 16
                })}
                onPress={navigation.goBack}
            >
                <Image
                    style={{
                        tintColor: theme.iconPrimary,
                        height: 10, width: 6,
                        justifyContent: 'center', alignItems: 'center',
                        left: -1
                    }}
                    source={require('@assets/ic-nav-back.png')}
                />
            </Pressable>
            <View style={{
                flexDirection: 'row',
                backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                borderRadius: 32,
                paddingRight: 12, paddingVertical: 4, paddingLeft: 4,
                gap: 4,
                justifyContent: 'center', alignItems: 'center'
            }}>
                <JettonIcon
                    size={24}
                    jetton={masterState}
                    theme={theme}
                    isTestnet={isTestnet}
                    backgroundColor={theme.backgroundUnchangeable}
                />
                <Text
                    style={[Typography.semiBold17_24, { maxWidth: '95%', color: theme.textUnchangeable }]}
                    numberOfLines={1} ellipsizeMode={'tail'}
                >
                    {masterState.name}
                </Text>
            </View>
            <View style={{ height: 32, width: 32 }} />
        </View>
    )
});

const JettonWalletHistoryHeader = memo(({
    owner,
    wallet,
    fullScreen,
    isLedger
}: {
    owner: string,
    wallet: string,
    fullScreen?: boolean,
    isLedger?: boolean
}) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const jettonWallet = useJettonWallet(wallet);
    const jetton = useJetton({ wallet, owner, master: jettonWallet?.master });
    const knownJettons = useKnownJettons(isTestnet);
    const swap = useJettonSwap(jetton?.master.toString({ testOnly: isTestnet }));
    const specialJettonMaster = knownJettons?.specialJetton ?? undefined;
    const isSpecial = !!specialJettonMaster && jetton?.master?.equals(Address.parse(specialJettonMaster));

    const balance = jetton?.balance ?? 0n;
    const balanceInNano = toNano(fromBnWithDecimals(balance, jetton?.decimals ?? 6));
    const balanceNum = Number(fromNano(balance));
    const swapAmount = (!!swap && balance > 0n)
        ? (Number(fromNano(swap)) * balanceNum).toFixed(2)
        : null;

    const { isSCAM } = useVerifyJetton({
        ticker: jetton?.symbol,
        master: jetton?.master.toString({ testOnly: isTestnet })
    });

    if (!jetton) { // should never happen
        return null;
    }

    const symbol = jetton.symbol ?? '';
    const walletAddress = Address.parse(wallet);

    return (
        <View>
            {Platform.OS === 'ios' && (
                <View
                    style={{
                        backgroundColor: theme.backgroundUnchangeable,
                        height: 1000,
                        position: 'absolute',
                        top: -1000,
                        left: 0,
                        right: 0,
                    }}
                />
            )}
            <View
                style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    height: 166,
                    position: 'absolute', top: 0, left: 0, right: 0,
                    borderBottomEndRadius: 20,
                    borderBottomStartRadius: 20,
                }}
            />
            {isSCAM && (
                <Text style={{ color: theme.accentRed }}>
                    {'SCAM'}
                </Text>
            )}
            <View style={[{
                flexGrow: 1,
                justifyContent: 'center',
                padding: 20, borderRadius: 20,
                marginTop: 8,
                marginHorizontal: 16,
                gap: 8,
            }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold32_38]}>
                            <ValueComponent
                                value={balance}
                                decimals={jetton?.decimals}
                                precision={1}
                            />
                            <Text style={[{ color: theme.textSecondary }, Typography.semiBold24_30]}>
                                {` ${symbol}`}
                            </Text>
                        </Text>
                        {isSpecial ? (
                            <PriceComponent
                                amount={balanceInNano}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    height: undefined,
                                    alignSelf: 'center'
                                }}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                theme={theme}
                                priceUSD={1}
                                hideCentsIfNull
                            />
                        ) : !!swapAmount && (
                            <PriceComponent
                                amount={toNano(swapAmount)}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    height: undefined,
                                    alignSelf: 'center'
                                }}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                theme={theme}
                                hideCentsIfNull
                            />
                        )}
                    </View>
                </View>
            </View>
            <View style={{
                height: 80,
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 16, marginHorizontal: 16,
                backgroundColor: theme.surfaceOnElevation,
                padding: 20, borderRadius: 20,
            }}>
                <Pressable
                    onPress={() => {
                        navigation.navigateReceive(isLedger
                            ? { addr: owner, ledger: true, jetton: jetton?.master, }
                            : { jetton: jetton?.master }
                        );
                    }}
                    style={({ pressed }) => ([
                        { opacity: pressed ? 0.5 : 1 },
                        { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center' }
                    ])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_receive.png')} />
                        </View>
                        <Text
                            style={[
                                { color: theme.textPrimary, marginTop: 6 },
                                Typography.medium15_20
                            ]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            numberOfLines={1}
                        >
                            {t('wallet.actions.receive')}
                        </Text>
                    </View>
                </Pressable>
                <Pressable
                    onPress={() => {
                        const tx = { jetton: walletAddress, amount: null, target: null, comment: null, stateInit: null, job: null, callback: null };
                        if (isLedger) {
                            navigation.navigateLedgerTransfer(tx);
                        } else {
                            navigation.navigateSimpleTransfer(tx);
                        }
                    }}
                    style={({ pressed }) => ([
                        { opacity: pressed ? 0.5 : 1 },
                        { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center' }
                    ])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_send.png')} />
                        </View>
                        <Text
                            style={[
                                { color: theme.textPrimary, marginTop: 6 },
                                Typography.medium15_20
                            ]}
                        >
                            {t('wallet.actions.send')}
                        </Text>
                    </View>
                </Pressable>
            </View>
            <PendingTransactions
                txFilter={(tx) => tx.body?.type === 'token' && tx.body.jetton.wallet.equals(walletAddress)}
                viewType={'history'}
            />
        </View>
    );
});

export const JettonWalletFragment = fragment(() => {
    const theme = useTheme();
    const { wallet, isLedger, address, fullScreen, bottomBarHeight = 0 } = useParams<JettonWalletFragmentParams & { fullScreen?: boolean, bottomBarHeight?: number }>();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const owner = Address.parse(address);
    const jettonWallet = useJettonWallet(wallet);
    const jetton = useJetton({ wallet: wallet, owner: address, master: jettonWallet?.master });
    const txs = useJettonWalletTransactios(address, wallet, isTestnet);

    const transactions = txs.data;
    let progress = txs.progress - (txs.progress ? - 0.1 : 0.1);
    if (progress < 0.45) {
        progress = 0.45;
    }

    const onReachedEnd = useCallback(() => {
        if (txs.hasNext && !txs.loading) {
            txs.next();
        }
    }, [txs.next, txs.hasNext, txs.loading]);

    if (!jetton) { // should never happen
        return null;
    }


    return (
        <View style={[
            Platform.select({
                android: { marginTop: safeArea.top },
                ios: fullScreen ? { paddingTop: safeArea.top } : undefined
            }),
            { flexGrow: 1 }
        ]}>
            {Platform.OS === 'ios' && fullScreen && (
                <View
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: safeArea.top,
                        width: '100%',
                        backgroundColor: theme.backgroundUnchangeable,
                    }}
                />
            )}
            <View>
                <StatusBar style={Platform.select({
                    android: theme.style === 'dark' ? 'light' : 'dark',
                    ios: 'light'
                })} />
                <JettonWalletHeader fullScreen={fullScreen} wallet={wallet} owner={address} />
                <WalletTransactions
                    txs={transactions ?? []}
                    address={owner}
                    navigation={navigation}
                    safeArea={safeArea}
                    onLoadMore={onReachedEnd}
                    hasNext={txs.hasNext}
                    loading={txs.loading}
                    ledger={isLedger}
                    theme={theme}
                    sectionedListProps={{
                        contentContainerStyle: {
                            backgroundColor: Platform.select({
                                ios: theme.elevation,
                                android: theme.backgroundPrimary
                            }),
                            paddingBottom: Platform.select({
                                ios: safeArea.bottom + 32,
                                android: safeArea.bottom + 32 + bottomBarHeight + 64
                            })
                        }
                    }}
                    showsVerticalScrollIndicator={false}
                    header={
                        <JettonWalletHistoryHeader
                            owner={address}
                            wallet={wallet}
                            fullScreen={fullScreen}
                            isLedger={isLedger}
                        />
                    }
                    bottomBarHeight={fullScreen ? bottomBarHeight + 56 : 0}
                    footer={
                        <View>
                            {txs.loading && (
                                <Animated.View
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                    style={{ height: 64, justifyContent: 'center', alignItems: 'center', width: '100%' }}
                                >
                                    <ReAnimatedCircularProgress
                                        size={24}
                                        color={theme.iconPrimary}
                                        reverse
                                        infinitRotate
                                        progress={progress}
                                    />
                                </Animated.View>
                            )}
                        </View>
                    }
                />
            </View>
        </View>
    );
});