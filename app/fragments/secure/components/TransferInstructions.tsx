import { parseTransactionInstructions } from "../../../utils/solana/parseInstructions";
import { useRegisterPendingSolana, useSolanaClients, useSolanaSelectedAccount, useTheme } from "../../../engine/hooks";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { Alert, ScrollView, View } from "react-native";
import { TransferInstructionView } from "../../solana/transfer/components/TransferInstructionView";
import { RoundButton } from "../../../components/RoundButton";
import { signAndSendSolanaTransaction, signAndSendSolanaVersionedTransaction } from "../utils/signAndSendSolanaTransaction";
import { useCallback, useEffect, useRef } from "react";
import { t } from "../../../i18n/t";
import { SolanaTransferFees } from "../../solana/transfer/components/SolanaTransferFees";
import { SolanaTransactionAppHeader } from "../transfer/SolanaTransactionAppHeader";
import { SolanaOrderApp } from "../ops/Order";
import { warn } from "../../../utils/log";

type TransferInstructionsProps = {
    instructions: ReturnType<typeof parseTransactionInstructions>;
    callback?: (ok: boolean, signature: string | null) => void;
    app?: SolanaOrderApp;
} & (
        | { transaction: Transaction; isVersioned: false }
        | { transaction: VersionedTransaction; isVersioned: true }
    );

export const TransferInstructions = (params: TransferInstructionsProps) => {
    const theme = useTheme();
    const solanaClients = useSolanaClients();
    const authContext = useKeysAuth();
    const solanaAddress = useSolanaSelectedAccount()!;
    const navigation = useTypedNavigation();
    const { transaction, instructions, callback, isVersioned } = params;

    // Set fee payer for legacy transactions only
    if (!isVersioned && !transaction.feePayer) {
        try {
            transaction.feePayer = new PublicKey(solanaAddress);
        } catch {
            warn('Invalid fee payer');
        }
    }

    const registerPending = useRegisterPendingSolana(solanaAddress);

    const ref = useRef<string | null>(null);

    const doSend = useCallback(async () => {
        try {
            const pending = isVersioned
                ? await signAndSendSolanaVersionedTransaction({
                    solanaClients,
                    theme,
                    authContext,
                    transaction: transaction as VersionedTransaction
                })
                : await signAndSendSolanaTransaction({
                    solanaClients,
                    theme,
                    authContext,
                    transaction: transaction as Transaction
                });
            ref.current = pending.id;
            registerPending({ ...pending, id: pending.base58Signature });
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
        navigation.goBack();
    }, [theme, authContext, transaction, isVersioned, solanaAddress, navigation, registerPending, callback]);

    useEffect(() => {
        return () => {
            callback?.(!!ref.current, ref.current);
        }
    }, []);

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
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column', gap: 16 }}>
                    {params.app && <SolanaTransactionAppHeader order={params.app} />}
                    {instructions.map((instruction, index) => (
                        <TransferInstructionView
                            key={index}
                            instruction={instruction}
                            owner={solanaAddress}
                        />
                    ))}
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
