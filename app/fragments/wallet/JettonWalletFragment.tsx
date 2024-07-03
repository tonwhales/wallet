import { Address, fromNano, toNano } from "@ton/core";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useJetton, useJettonWallet, useKnownJettons, useNetwork, useTheme, useVerifyJetton } from "../../engine/hooks";
import { Platform, View, Text, Pressable, Image } from "react-native";
import { WalletTransactions } from "./views/WalletTransactions";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useJettonWalletTransactios } from "../../engine/hooks/transactions/useJettonWalletTransactios";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useJettonSwap } from "../../engine/hooks/jettons/useJettonSwap";
import { JettonMasterState } from "../../engine/metadata/fetchJettonMasterContent";
import { JettonIcon } from "../../components/products/JettonIcon";
import { PerfText } from "../../components/basic/PerfText";
import { Typography } from "../../components/styles";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { ReAnimatedCircularProgress } from "../../components/CircularProgress/ReAnimatedCircularProgress";
import { fromBnWithDecimals } from "../../utils/withDecimals";

export type JettonWalletFragmentParams = {
    address: string;
    wallet: string;
    isLedger?: boolean;
};

export const JettonWalletFragment = fragment(() => {
    const theme = useTheme();
    const { wallet, isLedger, address } = useParams<JettonWalletFragmentParams>();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const walletAddress = Address.parse(wallet);
    const owner = Address.parse(address);
    const txsQuery = useJettonWalletTransactios(address, wallet, isTestnet, { refetchOnMount: true });
    const jettonWallet = useJettonWallet(wallet);
    const jetton = useJetton({ wallet: wallet, owner: address, master: jettonWallet?.master });
    const knownJettons = useKnownJettons(isTestnet);
    const swap = useJettonSwap(jetton?.master.toString({ testOnly: isTestnet }));

    const transactions = txsQuery.data;
    const progress = txsQuery.progress - (txsQuery.progress ? - 0.1 : 0.05);

    const specialJettonMaster = knownJettons?.specialJetton ?? undefined;
    const isSpecial = !!specialJettonMaster && jetton?.master?.equals(Address.parse(specialJettonMaster));

    const balance = jetton?.balance ?? 0n;
    const balanceInNano = toNano(fromBnWithDecimals(balance, jetton?.decimals ?? 6));
    const balanceNum = Number(fromNano(balance));
    const swapAmount = (!!swap && balance > 0n)
        ? (Number(fromNano(swap)) * balanceNum).toFixed(2)
        : null;

    const onReachedEnd = useCallback(() => {
        if (txsQuery.hasNext) {
            txsQuery.next();
        }
    }, [txsQuery.next, txsQuery.hasNext]);

    const { isSCAM } = useVerifyJetton({
        ticker: jetton?.symbol,
        master: jetton?.master.toString({ testOnly: isTestnet })
    });

    if (!jetton) { // should never happen
        return null;
    }

    let name = jetton.name;
    let symbol = jetton.symbol ?? '';

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
        <View style={[Platform.select({ android: { marginTop: safeArea.top } }), { flexGrow: 1 }]}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                leftButton={
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
                }
                title={name}
                style={{ backgroundColor: theme.backgroundUnchangeable, paddingHorizontal: 16 }}
                titleComponent={
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                        <JettonIcon
                            size={24}
                            jetton={masterState}
                            theme={theme}
                            isTestnet={isTestnet}
                            backgroundColor={theme.backgroundUnchangeable}
                        />
                        <Text
                            style={[Typography.semiBold17_24, { maxWidth: '70%', color: theme.textUnchangeable }]}
                            numberOfLines={1} ellipsizeMode={'tail'}
                        >
                            {name}
                        </Text>
                    </View>
                }
            />
            <View
                style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    height: 256,
                    position: 'absolute', top: 56, left: 0, right: 0,
                }}
            />
            <WalletTransactions
                txs={transactions ?? []}
                address={owner}
                navigation={navigation}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                hasNext={txsQuery.hasNext}
                loading={txsQuery.loading}
                ledger={isLedger}
                theme={theme}
                sectionedListProps={{
                    contentContainerStyle: {
                        backgroundColor: Platform.select({
                            ios: theme.elevation,
                            android: theme.backgroundPrimary
                        })
                    }
                }}
                showsVerticalScrollIndicator={false}
                header={<View>
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
                        marginTop: 8, marginHorizontal: 16,
                        gap: 8
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
                                    ? { addr: address, ledger: true, jetton: jetton?.master, }
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
                </View>}
                bottomBarHeight={safeArea.bottom + 32}
                footer={
                    <View>
                        {txsQuery.loading && (
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
    );
});