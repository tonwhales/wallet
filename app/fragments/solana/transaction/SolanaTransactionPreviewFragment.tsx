import { View, Text, Platform, ScrollView, Pressable } from "react-native";
import { fragment } from "../../../fragment";
import { SolanaTransfer, SolanaTransaction, SolanaTokenTransfer, SolanaNativeTransfer } from "../../../engine/api/solana/fetchSolanaTransactions";
import { useTheme } from "../../../engine/hooks/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { PerfView } from "../../../components/basic/PerfView";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { Typography } from "../../../components/styles";
import { StatusBar } from "expo-status-bar";
import { AddressInputAvatar } from "../../../components/address/AddressInputAvatar";
import { PerfText } from "../../../components/basic/PerfText";
import { ItemGroup } from "../../../components/ItemGroup";
import { t } from "../../../i18n/t";
import { SolanaTxInfo } from "./SolanaTxInfo";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { fromNano, toNano } from "@ton/core";
import { formatDate } from "../../../utils/dates";
import { formatTime } from "../../../utils/dates";
import { avatarColors } from "../../../components/avatar/Avatar";
import { avatarHash } from "../../../utils/avatarHash";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { copyText } from "../../../utils/copyText";
import { useCallback } from "react";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { useParams } from "../../../utils/useParams";

export type SolanaTransactionPreviewParams = {
    owner: string;
    transaction: SolanaTransaction;
    transfer: { data: SolanaTransfer, type: 'token' | 'native' };
}

type SolanaTxPreview = {
    op: string;
    amount: string;
    kind: 'in' | 'out';
    from: string;
    to: string;
    dateStr: string;
    decimals: number;
    symbol: string;
    mint?: string;
    comment?: string;
    address: string | undefined;
}

function transferInfo(params: { type: 'token' | 'native', transfer: SolanaTransfer, transaction: SolanaTransaction, owner: string }): SolanaTxPreview {
    const { type, transfer, transaction, owner } = params;
    const accountData = transaction.accountData;
    const dateStr = `${formatDate(transaction.timestamp, 'MMMM dd, yyyy')} • ${formatTime(transaction.timestamp)}`;

    if (type === 'token') {
        const tokenTransfer = transfer as SolanaTokenTransfer;
        const kind: 'in' | 'out' = tokenTransfer.fromUserAccount === owner ? 'out' : 'in';
        const op = kind === 'in' ? t('tx.received') : t('tx.sent');
        const toAccount = accountData?.find((acc) => acc.account === tokenTransfer.toTokenAccount);
        const toAddress = toAccount?.tokenBalanceChanges.find((change) => change.tokenAccount === tokenTransfer.toTokenAccount)?.userAccount;
        const address = kind === 'in' ? tokenTransfer.fromUserAccount : toAddress;
        const amount = fromBnWithDecimals(toNano(tokenTransfer.tokenAmount), 9);

        return {
            op,
            amount,
            kind,
            from: tokenTransfer.fromUserAccount,
            to: tokenTransfer.toTokenAccount,
            dateStr,
            decimals: 6,
            symbol: 'USDC',
            mint: tokenTransfer.mint,
            address
        }
    }

    const nativeTransfer = transfer as SolanaNativeTransfer;
    const kind: 'in' | 'out' = nativeTransfer.fromUserAccount === owner ? 'out' : 'in';
    const op = kind === 'in' ? t('tx.received') : t('tx.sent');
    const amount = fromNano(nativeTransfer.amount);
    const address = kind === 'in' ? nativeTransfer.fromUserAccount : nativeTransfer.toUserAccount;

    return {
        op,
        amount,
        kind,
        from: nativeTransfer.fromUserAccount,
        to: nativeTransfer.toUserAccount,
        dateStr,
        decimals: 9,
        symbol: 'SOL',
        address,
    }
}

const SolanaTransactionPreview = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const toaster = useToaster();
    const { owner, transaction, transfer } = useParams<SolanaTransactionPreviewParams>();
    const { data, type } = transfer;
    const { op, amount, kind, from, to, dateStr, decimals, symbol, mint, comment, address } = transferInfo({ type, transfer: data, transaction, owner });

    const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
    const avatarColor = avatarColors[avatarHash(address ?? '', avatarColors.length)];

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    return (
        <PerfView
            style={{
                alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
                alignItems: 'center',
                paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            }}
        >
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={dateStr}
                titleStyle={Typography.regular15_20}
            />
            <ScrollView
                style={{ flexGrow: 1, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                alwaysBounceVertical={false}
            >
                <PerfView style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20,
                    width: '100%',
                    overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <PerfView
                        style={{
                            backgroundColor: theme.divider,
                            position: 'absolute',
                            top: 0, left: 0, right: 0, height: 54
                        }}
                    />
                    <View style={{
                        width: 48, height: 48, borderRadius: 24,
                        backgroundColor: theme.surfaceOnBg,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <AddressInputAvatar
                            size={46}
                            theme={theme}
                            isOwn={false}
                            markContact={false}
                            friendly={address}
                            avatarColor={avatarColor}
                            knownWallets={{}}
                            hash={null}
                        />
                    </View>
                    <PerfText
                        style={[
                            {
                                color: theme.textPrimary,
                                paddingTop: 8,
                            },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </PerfText>
                    <>
                        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                                minimumFontScale={0.4}
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                style={[{ color: amountColor }, Typography.semiBold27_32]}
                            >
                                {`${amount} ${symbol}`}
                            </Text>
                        </View>
                    </>
                </PerfView>
                <>
                    <ItemGroup style={{ marginVertical: 16 }}>
                        <Pressable
                            onPress={() => onCopyAddress(from)}
                            style={({ pressed }) => ({ paddingHorizontal: 10, justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
                        >
                            <PerfText style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {t('common.from')}
                            </PerfText>
                            <PerfView style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {kind === 'in' ? (
                                        <PerfText>
                                            {from}
                                        </PerfText>
                                    ) : (
                                        <PerfText style={{ color: theme.textPrimary }}>
                                            <SolanaWalletAddress
                                                address={from}
                                                elipsise={{ end: 4 }}
                                                copyOnPress
                                                disableContextMenu
                                                copyToastProps={{ marginBottom: 70 }}
                                            />
                                        </PerfText>
                                    )}
                                </PerfText>
                            </PerfView>
                        </Pressable>
                        <PerfView style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <Pressable
                            onPress={() => onCopyAddress(to)}
                            style={({ pressed }) => ({ paddingHorizontal: 10, justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
                        >
                            <PerfText style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {t('common.to')}
                            </PerfText>
                            <PerfView style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <PerfText style={[{ color: theme.textSecondary }, Typography.regular17_24]}>
                                    {kind === 'in' ? (
                                        <SolanaWalletAddress
                                            address={to}
                                            elipsise={{ end: 4 }}
                                            copyOnPress
                                            disableContextMenu
                                            copyToastProps={{ marginBottom: 70 }}
                                        />
                                    ) : (
                                        <PerfText style={{ color: theme.textPrimary }}>
                                            {to}
                                        </PerfText>
                                    )}
                                </PerfText>
                            </PerfView>
                        </Pressable>
                        {/* <PreviewTo
                            onCopyAddress={onCopyAddress}
                            to={to}
                            kind={kind}
                            theme={theme}
                            testOnly={isTestnet}
                            bounceableFormat={isTargetBounceable}
                        /> */}
                        <PerfView style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <SolanaTxInfo {...transaction} />
                    </ItemGroup>
                    {/* <PerfView style={{
                        backgroundColor: theme.surfaceOnElevation,
                        padding: 20, borderRadius: 20,
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <PerfView>
                            <PerfText
                                style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                                {t('txPreview.blockchainFee')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {tx.base.fees
                                    ? <>
                                        {`${formatAmount(fromNano(fees))} TON`}
                                        <PerfText style={{ color: theme.textSecondary }}>
                                            {` ${feesPrise}`}
                                        </PerfText>
                                    </>
                                    : '...'
                                }
                            </PerfText>
                        </PerfView>
                        <AboutIconButton
                            title={t('txPreview.blockchainFee')}
                            description={t('txPreview.blockchainFeeDescription')}
                            style={{ height: 24, width: 24, position: undefined, marginRight: 8 }}
                            size={24}
                        />
                    </PerfView> */}
                </>
            </ScrollView>
            {/* {!!repeatParams && (
                <PerfView style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={() => {
                            if (repeatParams.type === 'simple') {
                                navigation.navigateSimpleTransfer(repeatParams);
                            } else {
                                navigation.navigateTransfer(repeatParams);
                            }
                        }}
                    />
                </PerfView>
            )} */}
        </PerfView>
    );
});

SolanaTransactionPreview.displayName = 'SolanaTransactionPreview';
export const SolanaTransactionPreviewFragment = fragment(SolanaTransactionPreview);
