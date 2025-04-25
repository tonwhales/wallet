import { View, Text, Platform, ScrollView, Pressable } from "react-native";
import { fragment } from "../../../fragment";
import { SolanaTransfer, SolanaTransaction } from "../../../engine/api/solana/fetchSolanaTransactions";
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
import { SolanaTxInfo } from "./components/SolanaTxInfo";
import { avatarColors } from "../../../components/avatar/Avatar";
import { avatarHash } from "../../../utils/avatarHash";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { copyText } from "../../../utils/copyText";
import { useCallback } from "react";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { useParams } from "../../../utils/useParams";
import { solanaPreviewToTransferParams } from "../../../utils/solana/solanaPreviewToTransferParams";
import { RoundButton } from "../../../components/RoundButton";
import { useSolanaTransferInfo } from "../../../engine/hooks";

export type SolanaTransactionPreviewParams = {
    owner: string;
    transaction: SolanaTransaction;
    transfer: { data: SolanaTransfer, type: 'token' | 'native' };
}

const SolanaTransactionPreview = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const toaster = useToaster();
    const { owner, transaction, transfer } = useParams<SolanaTransactionPreviewParams>();
    const { data, type } = transfer;
    const transferInfo = useSolanaTransferInfo({ type, transfer: data, transaction, owner });
    const { op, amount, kind, from, to, dateStr, symbol, address } = transferInfo;
    const transferParams = solanaPreviewToTransferParams(transferInfo);

    const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
    const avatarColor = avatarColors[avatarHash(address ?? '', avatarColors.length)];

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT
        });
    }, []);

    const onRepeat = () => {
        if (transferParams) {
            navigation.navigateSolanaSimpleTransfer(transferParams);
        }
    };

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
                        width: 68, height: 68, borderRadius: 34,
                        backgroundColor: theme.surfaceOnBg,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <AddressInputAvatar
                            size={68}
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
                        style={[{ color: theme.textPrimary, paddingTop: 8 }, Typography.semiBold17_24]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </PerfText>
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
                </PerfView>
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
                    <PerfView style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                    <SolanaTxInfo signature={transaction.signature} />
                </ItemGroup>
            </ScrollView>
            {!!transferParams && (
                <PerfView style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={onRepeat}
                    />
                </PerfView>
            )}
        </PerfView>
    );
});

SolanaTransactionPreview.displayName = 'SolanaTransactionPreview';
export const SolanaTransactionPreviewFragment = fragment(SolanaTransactionPreview);