import { Platform, ScrollView, View, Text, Pressable, Alert } from "react-native";
import { fragment } from "../../../fragment";
import { useParams } from "../../../utils/useParams";
import { SolanaOrder } from "../ops/Order"
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { useSolanaClients, useSolanaSelectedAccount, useSolanaToken, useTheme, useRegisterPendingSolana, useSolanaTransactionFromOrder, useCurrentAddress, useNetwork, useForcedAvatarType } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItemGroup } from "../../../components/ItemGroup";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";
import { useCallback, useMemo } from "react";
import { copyText } from "../../../utils/copyText";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { RoundButton } from "../../../components/RoundButton";
import { signAndSendSolanaOrder } from "../utils/signAndSendSolanaOrder";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { AddressInputAvatar } from "../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../utils/avatarHash";
import { avatarColors } from "../../../components/avatar/Avatar";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { fromNano } from "@ton/core";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { TransferInstructions } from "../components/TransferInstructions";
import { SolanaTransactionAppHeader } from "./SolanaTransactionAppHeader";
import { SolanaTransferFees } from "../../solana/transfer/components/SolanaTransferFees";
import { trackMaestraSent } from "../../../analytics/maestra";
import { useHoldersProfile } from "../../../engine/hooks/holders/useHoldersProfile";
import { SolanaTransferParams, paramsToTransfer } from "./solanaTransferParams";

export { SolanaTransferParams } from "./solanaTransferParams";

const TransferOrder = (props: { order: SolanaOrder, callback?: (ok: boolean, signature: string | null) => void }) => {
    const { order, callback } = props;
    const theme = useTheme();
    const toaster = useToaster();
    const solanaClients = useSolanaClients();
    const authContext = useKeysAuth();
    const solanaAddress = useSolanaSelectedAccount()!;
    const { tonAddress } = useCurrentAddress();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const token = useSolanaToken(solanaAddress, order.token?.mint);
    const registerPending = useRegisterPendingSolana(solanaAddress);
    const transaction = useSolanaTransactionFromOrder(order, solanaAddress, solanaClients);
    const profile = useHoldersProfile(tonAddress!.toString({ testOnly: isTestnet })).data;

    const forceAvatar = useForcedAvatarType({ address: order.target });

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    const avatarColorHash = avatarHash(order.target, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const amount = token ? fromBnWithDecimals(order.amount, token.decimals) : fromNano(order.amount);
    const amountText = amount + ' ' + (token?.symbol ?? 'SOL');

    const doSend = useCallback(async () => {
        try {
            const pending = await signAndSendSolanaOrder({
                solanaClients,
                theme,
                authContext,
                order,
                sender: solanaAddress
            });

            if (!isTestnet) {
                trackMaestraSent({
                    amount: amount,
                    currency: token?.symbol ?? 'SOL',
                    walletID: solanaAddress,
                    tonhubID: profile?.userId,
                    transactionID: pending.id
                });
            }

            registerPending(pending);
            callback?.(true, pending.id);
        } catch (error) {
            Alert.alert(
                t('transfer.solana.error.title'),
                (error as Error).message,
                [
                    {
                        text: t('common.ok'),
                        onPress: () => {
                            navigation.goBack();
                        }
                    }
                ]
            );
            return;
        }
        // Reset stack to root
        navigation.popToTop();
    }, [theme, authContext, order, solanaAddress, navigation, registerPending, callback]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    {order.app && <SolanaTransactionAppHeader order={order.app} />}
                    <ItemGroup style={{ marginBottom: 16, marginTop: 16, paddingTop: 27 }}>
                        <View style={{
                            backgroundColor: theme.divider,
                            height: 54,
                            position: 'absolute', left: 0, right: 0
                        }} />
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 68, flexDirection: 'row', height: 68 }}>
                                <AddressInputAvatar
                                    size={68}
                                    theme={theme}
                                    isOwn={false}
                                    markContact={false}
                                    friendly={order.target}
                                    avatarColor={avatarColor}
                                    forceAvatar={forceAvatar}
                                />
                            </View>
                        </View>
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={[{ color: theme.textPrimary, marginTop: 8 }, Typography.semiBold17_24]}>
                                {t('common.send')}
                            </Text>
                            <Text style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.regular17_24]}>
                                <SolanaWalletAddress
                                    address={order.target}
                                    elipsise={{ start: 4, end: 4 }}
                                    copyOnPress
                                    disableContextMenu
                                    copyToastProps={{ marginBottom: 70 }}
                                />
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                minimumFontScale={0.4}
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                style={[{ color: theme.textPrimary, marginTop: 12 }, Typography.semiBold27_32]}
                            >
                                {amountText}
                            </Text>
                        </View>
                    </ItemGroup>

                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    <Text style={{ color: theme.textPrimary }}>
                                        <SolanaWalletAddress
                                            address={solanaAddress}
                                            elipsise={{ end: 4 }}
                                            disableContextMenu
                                        />
                                    </Text>
                                </Text>
                            </View>
                        </View>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <Pressable
                            style={({ pressed }) => ({
                                paddingHorizontal: 10, justifyContent: 'center',
                                opacity: pressed ? 0.5 : 1,
                            })}
                            onPress={() => onCopyAddress(order.target)}
                        >
                            <Text style={{
                                fontSize: 13, lineHeight: 18, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.to')}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                >
                                    <Text style={{ color: theme.textPrimary }}>
                                        {order.target.replaceAll('-', '\u2011')}
                                    </Text>
                                </Text>
                            </View>
                        </Pressable>
                    </ItemGroup>
                    {order.comment && order.comment.length > 0 && (
                        <ItemGroup style={{ marginBottom: 16 }}>
                            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    {t('common.message')}
                                </Text>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                        {order.comment}
                                    </Text>
                                </View>
                            </View>
                        </ItemGroup>
                    )}
                    <SolanaTransferFees tx={transaction} />
                    <View style={{ height: 54 }} />
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <RoundButton
                    title={t('common.confirm')}
                    action={doSend}
                />
            </View>
        </View>
    );
}

const TransferLoaded = (params: SolanaTransferParams) => {
    const navigation = useTypedNavigation();
    const transfer = paramsToTransfer(params);

    if (!transfer) {
        navigation.goBack();
        return;
    }

    if (transfer.type === 'order') {
        return <TransferOrder order={transfer.order} callback={params.callback} />
    }

    if (transfer.type === 'versioned-instructions') {
        return (
            <TransferInstructions
                instructions={transfer.instructions}
                transaction={transfer.transaction}
                callback={params.callback}
                app={transfer.app}
                isVersioned={true}
            />
        );
    }

    return (
        <TransferInstructions
            instructions={transfer.instructions}
            transaction={transfer.transaction}
            callback={params.callback}
            app={transfer.app}
            isVersioned={false}
        />
    );
}

export const SolanaTransferFragment = fragment(() => {
    const params: SolanaTransferParams = useParams();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                style={[{ paddingLeft: 16 }, Platform.select({ android: { paddingTop: safeArea.top } })]}
                onBackPressed={navigation.goBack}
                onClosePressed={() => navigation.navigateAndReplaceAll('Home')}
            />
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                <TransferLoaded {...params} />
            </View>
        </View>
    );
});