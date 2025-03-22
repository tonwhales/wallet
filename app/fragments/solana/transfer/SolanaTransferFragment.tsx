import { Platform, ScrollView, View, Text, Pressable, Alert } from "react-native";
import { fragment } from "../../../fragment";
import { useParams } from "../../../utils/useParams";
import { SolanaOrder } from "../../secure/ops/Order"
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { useSolanaClient, useSolanaSelectedAccount, useSolanaToken, useTheme, useRegisterPendingSolana } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItemGroup } from "../../../components/ItemGroup";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";
import { useCallback } from "react";
import { copyText } from "../../../utils/copyText";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { RoundButton } from "../../../components/RoundButton";
import { sendSolanaOrder } from "../../../utils/solana/sendSolanaTransaction";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { AddressInputAvatar } from "../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../utils/avatarHash";
import { avatarColors } from "../../../components/avatar/Avatar";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { fromNano } from "@ton/core";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { Transaction } from "@solana/web3.js";
import { parseTransactionInstructions, ParsedTransactionInstruction } from "../../../utils/solana/parseInstructions";
import { signAndSendSolanaTransaction } from "../../../utils/solana/signAndSendSolanaTransaction";
import { WalletResponse } from "@tonconnect/protocol";
import { ItemDivider } from "../../../components/ItemDivider";

type SolanaOrderTransferParams = {
    type: 'order';
    order: SolanaOrder
}

type SolanaTransactionTransferParams = {
    type: 'transaction';
    transaction: string;
}

export type SolanaTransferParams = (SolanaOrderTransferParams | SolanaTransactionTransferParams) & {
    callback?: (response: WalletResponse<'sendTransaction'>) => void
};


type TransferLoadedParams = {
    type: 'order';
    order: SolanaOrder
} | {
    type: 'instructions';
    instructions: ReturnType<typeof parseTransactionInstructions>;
}

function paramsToTransfer(order: SolanaTransferParams): TransferLoadedParams {
    if (order.type === 'order') {
        return order;
    }

    const transaction = Transaction.from(Buffer.from(order.transaction, 'base64'));

    return {
        type: 'instructions',
        instructions: parseTransactionInstructions(transaction.instructions)
    };
}

const TransferOrder = (order: SolanaOrder) => {
    const theme = useTheme();
    const toaster = useToaster();
    const solanaClient = useSolanaClient();
    const authContext = useKeysAuth();
    const solanaAddress = useSolanaSelectedAccount()!;
    const navigation = useTypedNavigation();

    const token = useSolanaToken(solanaAddress, order.token?.mint);
    const registerPending = useRegisterPendingSolana(solanaAddress);

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    const doSend = useCallback(async () => {
        try {
            const pending = await sendSolanaOrder({
                solanaClient,
                theme,
                authContext,
                order,
                sender: solanaAddress
            });
            registerPending(pending);
        } catch (error) {
            // TODO: *solana* humanize error ui
            Alert.alert('Error', (error as Error).message);
        }
        // Reset stack to root
        navigation.popToTop();
    }, [theme, authContext, order, solanaAddress, navigation, registerPending]);

    const avatarColorHash = avatarHash(order.target, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const amount = token ? fromBnWithDecimals(order.amount, token.decimals) : fromNano(order.amount);
    const amountText = amount + ' ' + (token?.symbol ?? 'SOL');

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
                                    knownWallets={{}}
                                    hash={null}
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

const TransferInstructionView = (params: { instruction: ParsedTransactionInstruction }) => {
    // TODO: *solana* map instruction ui elements with instruction args
    const { instruction } = params;
    const theme = useTheme();
    const op = instruction?.name;
    const description = instruction?.description;
    const program = instruction?.program;

    let amount = '';
    let from = '';
    let to = '';
    let token = '';

    if (!instruction) {
        return null;
    }

    switch (op) {
        case 'depositCard':
            from = instruction.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
            to = instruction.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
            break;
        case 'updateCardLimits':
            from = instruction.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
            to = instruction.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
            break;
    }

    return (
        <>
            <ItemGroup style={{ marginBottom: 16, marginTop: 16 }}>
                <View style={{ gap: 16 }}>
                    <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                            {'Operation'}
                        </Text>
                        <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {t('solana.instructions.' + op)}
                            </Text>
                        </View>
                    </View>
                    <ItemDivider marginHorizontal={10} marginVertical={0} />
                    <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                            {'Description'}
                        </Text>
                        <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {description}
                            </Text>
                        </View>
                    </View>
                </View>
            </ItemGroup>
            {(from && to) && (
                <ItemGroup style={{ marginBottom: 16 }}>
                    <View style={{ gap: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {'From'}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {from}
                                </Text>
                            </View>
                        </View>
                        <ItemDivider marginHorizontal={10} marginVertical={0} />
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {'To'}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {to}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ItemGroup>
            )}

            {!!instruction.args && (
                <ItemGroup style={{ marginBottom: 16 }}>
                    <View style={{ gap: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {'Arguments'}
                            </Text>
                            <View style={{ gap: 4 }}>
                                {(instruction.args as any[]).map((arg, index) => {
                                    const isObject = typeof arg === 'object';

                                    if (arg.name === 'cardSeed' || arg.name === 'newSeqno' || arg.name === 'rootSeed') {
                                        return null;
                                    }

                                    if (isObject) {
                                        return (
                                            <View key={index}>
                                                {Object.entries(arg).map(([key, value]) => {
                                                    if (key === 'type') {
                                                        return null;
                                                    }
                                                    return (
                                                        <Text key={key} style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                                            {`${key}: ${value}`}
                                                        </Text>
                                                    )
                                                })}
                                                {(index !== 0 && index !== (instruction.args as any[]).length - 1) && (
                                                    <ItemDivider marginHorizontal={0} marginVertical={8} />
                                                )}
                                            </View>
                                        )
                                    }

                                    return (
                                        <View key={index}>
                                            <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                                {`${arg}`}
                                            </Text>
                                        </View>
                                    )
                                })}
                            </View>
                        </View>
                    </View>
                </ItemGroup>
            )}
        </>
    )
}

const TransferInstructions = (params: {
    instructions: ReturnType<typeof parseTransactionInstructions>;
    transaction: string;
    callback?: (response: WalletResponse<'sendTransaction'>) => void
}) => {
    const theme = useTheme();
    const toaster = useToaster();
    const solanaClient = useSolanaClient();
    const authContext = useKeysAuth();
    const solanaAddress = useSolanaSelectedAccount()!;
    const navigation = useTypedNavigation();
    const transaction = Transaction.from(Buffer.from(params.transaction, 'base64'));

    const registerPending = useRegisterPendingSolana(solanaAddress);

    const doSend = useCallback(async () => {
        try {
            const pending = await signAndSendSolanaTransaction({
                solanaClient,
                theme,
                authContext,
                transaction
            });
            registerPending(pending);
        } catch (error) {
            // TODO: *solana* humanize error ui
            Alert.alert('Error', (error as Error).message);
        }
    }, [theme, authContext, params, solanaAddress, navigation, registerPending]);

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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                            {'Solana Transaction'}
                        </Text>
                    </View>
                    {params.instructions.map((instruction, index) => (
                        <TransferInstructionView key={index} instruction={instruction} />
                    ))}
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
    const transfer = paramsToTransfer(params);

    if (transfer.type === 'order') {
        return <TransferOrder {...transfer.order} />
    }

    return (
        <TransferInstructions
            instructions={transfer.instructions}
            transaction={(params as SolanaTransactionTransferParams).transaction}
            callback={params.callback}
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