import { useCallback, useRef, useMemo, useEffect } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTheme, useAppState, useNetwork, useWalletsSettings, useBounceableWalletFormat, useCurrentAddress, useSolanaToken } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { getChainShortNameByChain, getCoinInfoByCurrency, getKnownCurrencyFromName, KNOWN_TICKERS } from "../../engine/utils/chain";
import { Typography } from "../../components/styles";
import { RoundButton } from "../../components/RoundButton";
import { addSpaceSeparators, humanizeNumberAdaptive } from "../../utils/holders/humanize";
import { OrderInfoLine } from "../../components/orders/OrderInfoLine";
import { OrderInfoRich } from "../../components/orders/OrderInfoRich";
import { OrderStatus } from "../../components/orders/OrderStatus";
import { isTonAddress } from "../../utils/ton/address";
import { shortAddress } from "../../utils/shortAddress";
import { Address, toNano } from "@ton/core";
import { useKnownWallets } from "../../secure/KnownWallets";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { OrderCloseModal } from "../../components/orders/OrderCloseModal";
import { useParams } from "../../utils/useParams";
import { ChangellyTransactionModel } from "../../engine/api/changelly/fetchChangellyUserTransactions";
import { getOrderState } from "../../engine/utils/orders";
import { useResolveChangellyTransaction } from "../../engine/hooks/changelly/useResolveChangellyTransaction";
import Intercom, { Space } from "@intercom/intercom-react-native";

import ExchangeRateIcon from '@assets/order/exchange-rate.svg';
import NetworkFeeIcon from '@assets/order/network-fee.svg';
import SendAmountIcon from '@assets/order/send-amount.svg';
import ToAccountIcon from '@assets/order/to-account.svg';
import ResultIcon from '@assets/order/result.svg';
import { useSpecialJetton } from "../../engine/hooks/jettons/useSpecialJetton";
import { toBnWithDecimals } from "../../utils/withDecimals";
import { SOLANA_USDC_MINT_MAINNET } from "../../utils/solana/address";
import { useChangellyEvents } from "../../engine/hooks/changelly/useChangellyEvents";

export type ChangellyOrderFragmentParams = {
    changellyTransaction: ChangellyTransactionModel;
    isAfterCreation?: boolean;
}

export const ChangellyOrderFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const appState = useAppState();
    const { isTestnet } = useNetwork();
    const knownWallets = useKnownWallets(isTestnet);
    const [walletsSettings] = useWalletsSettings();
    const [bounceableFormat] = useBounceableWalletFormat()
    const orderCloseModalRef = useRef<BottomSheetModal>(null);
    const { changellyEvents, saveChangellyEvents } = useChangellyEvents()
    const { tonAddress, solanaAddress, isLedger } = useCurrentAddress()
    const specialJetton = useSpecialJetton(tonAddress);
    const token = useSolanaToken(solanaAddress!, SOLANA_USDC_MINT_MAINNET);

    const { changellyTransaction, isAfterCreation } = useParams<ChangellyOrderFragmentParams>()
    const { amountExpectedFrom,
        fromCurrency,
        network,
        payinAddress,
        networkFee,
        exchangeRate: exchangeRateString,
        toCurrency,
        amountExpectedTo,
        payoutAddress,
        expiresAt,
        status,
        error,
        id: transactionId
    } = changellyTransaction
    const { mutate: resolveChangellyTransaction, isSuccess: isTransactionResolved, isLoading: isResolvingTransaction } = useResolveChangellyTransaction();
    const { isInitial, isPending, isSuccess, isFailure } = getOrderState(status);
    const isDepositFromTonhubDone = changellyEvents?.[transactionId]?.isDepositFromTonhubDone

    const amount = humanizeNumber(amountExpectedFrom ?? '0')
    const exchangeRate = exchangeRateString ?? '1'

    const originKnownCurrency = getKnownCurrencyFromName(fromCurrency);
    const originCoinName = originKnownCurrency ? getCoinInfoByCurrency(originKnownCurrency).name.toUpperCase() : fromCurrency.toUpperCase();
    const originBlockchain = network ?? ''
    const originBlockchainTag = getChainShortNameByChain(originBlockchain) || originBlockchain?.toUpperCase();

    const resultKnownCurrency = getKnownCurrencyFromName(toCurrency);
    const resultCoinName = resultKnownCurrency ? getCoinInfoByCurrency(resultKnownCurrency).name.toUpperCase() : toCurrency.toUpperCase();
    const resultBlockchain = KNOWN_TICKERS[toCurrency]

    const amountDisplayValue = `${addSpaceSeparators(amount)} ${originCoinName}`;
    const targetAddressDisplayValue = payinAddress;
    const networkDisplayValue = `${originBlockchain.charAt(0).toUpperCase() + originBlockchain.slice(1)} (${originBlockchainTag})`;
    const networkFeeDisplayValue = `${humanizeNumberAdaptive(networkFee ?? 0)}%`;
    const exchangeRateDisplayValue = `1 ${resultCoinName} (${getChainShortNameByChain(resultBlockchain)}) = ${humanizeNumberAdaptive(exchangeRate)} ${originCoinName} (${originBlockchainTag})`;
    const youSendDisplayValue = `${addSpaceSeparators(amount)} ${originCoinName} (${originBlockchainTag})`;
    const youGetDisplayValue = `${humanizeNumberAdaptive(amountExpectedTo ?? 0)} ${resultCoinName} (${getChainShortNameByChain(resultBlockchain)})`;

    const walletDisplayValue = useMemo(() => {
        if (isTonAddress(payoutAddress)) {
            try {
                const parsedAddress = Address.parse(payoutAddress);
                const addressString = parsedAddress.toString({ testOnly: isTestnet });

                const walletIndex = appState.addresses.findIndex(w => w.address.equals(parsedAddress));
                if (walletIndex !== -1) {
                    const walletSettings = walletsSettings[addressString];
                    const walletName = walletSettings?.name || `${t('common.wallet')} ${walletIndex + 1}`;
                    const shortAddr = shortAddress({ isTestnet, address: parsedAddress, isBounceable: bounceableFormat });
                    return `${walletName} (${shortAddr})`;
                }

                return shortAddress({ isTestnet, address: parsedAddress, isBounceable: bounceableFormat });
            } catch {
                return shortAddress({ friendly: payoutAddress });
            }
        } else {
            return shortAddress({ friendly: payoutAddress });
        }
    }, [payoutAddress, isTestnet, appState.addresses, walletsSettings, knownWallets]);

    const orderTitle = (() => {
        if (isPending) return t('order.info.title.pending');
        if (isSuccess) return t('order.info.title.success');
        if (isFailure) return t('order.info.title.failure');
        return t('order.sendToDeposit', { currency: originCoinName })
    })();

    const orderDescription = (() => {
        if (isPending) return t('order.info.description.pending');
        if (isSuccess) return t('order.info.description.success');
        if (isFailure) {
            if (error) return error;

            return t('order.info.description.failure');
        }

        return t('order.waitingTransfer');
    })();

    useEffect(() => {
        if (isTransactionResolved) {
            orderCloseModalRef.current?.close();
            navigation.popToTop()
        }
    }, [isTransactionResolved]);

    const onClosePress = useCallback(() => {
        orderCloseModalRef.current?.present();
    }, []);

    const onCloseOrder = useCallback(() => {
        orderCloseModalRef.current?.present();
        resolveChangellyTransaction({
            transactionId: changellyTransaction.id,
            toCurrency
        });
    }, [changellyTransaction.id, toCurrency]);

    const onContactSupport = useCallback(() => {
        Intercom.presentSpace(Space.home)
    }, []);

    const onSendCallback = useCallback((ok: boolean) => {
        if (!ok) return
        saveChangellyEvents(transactionId, { isDepositFromTonhubDone: true })
    }, [transactionId, saveChangellyEvents]);

    const onSend = useCallback(() => {
        switch (fromCurrency) {
            case 'usdton':
                const hasSpecialJettonWallet = !!specialJetton?.wallet;
                const usdtAmount = toBnWithDecimals(amount, 9);
                if (hasSpecialJettonWallet) {
                    navigation.navigateSimpleTransfer({
                        amount: usdtAmount,
                        target: targetAddressDisplayValue,
                        comment: null,
                        asset: {
                            type: 'jetton',
                            master: specialJetton.master,
                            wallet: specialJetton.wallet,
                        },
                        stateInit: null,
                        callback: onSendCallback
                    }, { ledger: isLedger });
                }
                break;
            case 'ton':
                const tonAmount = toBnWithDecimals(amount, 9);
                navigation.navigateSimpleTransfer({
                    amount: tonAmount,
                    target: targetAddressDisplayValue,
                    comment: null,
                    stateInit: null,
                    callback: onSendCallback
                }, { ledger: isLedger });
                break;
            case 'sol':
                const solAmount = toNano(amount);
                navigation.navigateSolanaSimpleTransfer({
                    target: targetAddressDisplayValue,
                    comment: null,
                    amount: solAmount.toString(),
                    token: null,
                    callback: onSendCallback
                })
            case 'usdcsol':
                const usdcSolAmount = toNano(amount);
                navigation.navigateSolanaSimpleTransfer({
                    target: targetAddressDisplayValue,
                    comment: null,
                    amount: usdcSolAmount.toString(),
                    token: token?.address,
                    callback: onSendCallback
                })
        }
    }, [transactionId, amount, token, targetAddressDisplayValue, isLedger, specialJetton, fromCurrency])

    const canSend = useMemo(() => {
        return isInitial &&
            (fromCurrency === 'usdton'
                || fromCurrency === 'ton'
                || fromCurrency === 'sol'
                || fromCurrency === 'usdcsol')
            && !isDepositFromTonhubDone
    }, [isInitial, fromCurrency, isDepositFromTonhubDone]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={navigation.goBack}
            />
            <ScrollView style={{ paddingHorizontal: 16, flex: 1 }} keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 8, paddingBottom: 0 }}>
                <OrderStatus
                    expiresAt={expiresAt}
                    isInitial={isInitial}
                    isPending={isPending}
                    isSuccess={isSuccess}
                    isFailure={isFailure}
                />
                <Text style={[Typography.semiBold27_32, { color: theme.textPrimary, textAlign: 'center' }]}>
                    {orderTitle}
                </Text>
                <Text style={[Typography.medium17_24, { color: theme.textSecondary, textAlign: 'center' }]}>
                    {orderDescription}
                </Text>
                <View style={{ backgroundColor: theme.surfaceOnElevation, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 20, gap: 16, marginTop: 16 }}>
                    <OrderInfoRich
                        title={t('order.amount')}
                        value={amountDisplayValue}
                        tag={originBlockchainTag}
                        valueType="medium"
                        withCopy
                        copyMessage={t('order.info.notifications.amountCopiedSuccess')}
                    />
                    <OrderInfoRich
                        title={t('order.address')}
                        value={targetAddressDisplayValue}
                        withCopy
                        copyMessage={t('order.info.notifications.payAddressCopiedSuccess')}
                    />
                    <OrderInfoRich
                        title={t('order.network')}
                        value={networkDisplayValue}
                    />
                </View>
                <View style={{ gap: 12, marginTop: 8 }}>
                    <OrderInfoLine icon={NetworkFeeIcon} label={t('order.networkServiceFee')} value={networkFeeDisplayValue} />
                    <OrderInfoLine icon={ExchangeRateIcon} label={t('order.exchangeRate')} value={exchangeRateDisplayValue} />
                    <OrderInfoLine icon={SendAmountIcon} label={t('order.youSend')} value={youSendDisplayValue} />
                    <OrderInfoLine icon={ToAccountIcon} label={t('order.wallet')} value={walletDisplayValue} />
                    <OrderInfoLine icon={ResultIcon} label={t('order.youGet')} value={youGetDisplayValue} />
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[
                    { marginHorizontal: 16, marginTop: 8 },
                    Platform.select({
                        android: { marginBottom: safeArea.bottom + 16 },
                        ios: { marginBottom: safeArea.bottom + 16 }
                    })
                ]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 0}
            >
                {isAfterCreation ? (
                    <>
                        {canSend ? <RoundButton
                            title={'Send'}
                            onPress={onSend}
                            style={{ marginTop: 8 }}
                        /> :
                            <RoundButton
                                title={t('order.continue')}
                                onPress={() => {
                                    navigation.navigateAndReplaceHome();
                                }}
                            />}
                        <RoundButton
                            title={t('order.closeOrder')}
                            onPress={onClosePress}
                            display="secondary"
                            style={{ marginTop: 8 }}
                        />
                    </>
                ) : (
                    <>
                        {canSend && <RoundButton
                            title={'Send'}
                            onPress={onSend}
                            style={{ marginTop: 8 }}
                        />}
                        {isInitial && !isDepositFromTonhubDone && (
                            <RoundButton
                                title={t('order.closeOrder')}
                                onPress={onClosePress}
                                display={canSend ? "secondary" : "default"}
                                style={{ marginTop: 8 }}
                            />
                        )}
                        {!canSend && <RoundButton
                            title={t('order.contactSupport')}
                            onPress={onContactSupport}
                            display="secondary"
                            style={{ marginTop: 8 }}
                        />}
                    </>
                )}
            </KeyboardAvoidingView>
            <OrderCloseModal ref={orderCloseModalRef} onClose={onCloseOrder} isClosing={isResolvingTransaction} />
        </View>
    );
});
