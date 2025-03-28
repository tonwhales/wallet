import { parseTransactionInstructions } from "../../../../utils/solana/parseInstructions";
import { useRegisterPendingSolana, useSolanaClient, useSolanaSelectedAccount, useTheme } from "../../../../engine/hooks";
import { useKeysAuth } from "../../../../components/secure/AuthWalletKeys";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { Message, PublicKey, Transaction } from "@solana/web3.js";
import { Alert, ScrollView, View } from "react-native";
import { TransferInstructionView } from "./TransferInstructionView";
import { RoundButton } from "../../../../components/RoundButton";
import { signAndSendSolanaTransaction } from "../../../../utils/solana/signAndSendSolanaTransaction";
import { useCallback, useEffect, useRef } from "react";
import { t } from "../../../../i18n/t";
import { SolanaTransferFees } from "./SolanaTransferFees";
import { warn } from "../../../../utils/log";

export const TransferInstructions = (params: {
    instructions: ReturnType<typeof parseTransactionInstructions>;
    transaction: Transaction;
    callback?: (ok: boolean, signature: string | null) => void
}) => {
    const theme = useTheme();
    const solanaClient = useSolanaClient();
    const authContext = useKeysAuth();
    const solanaAddress = useSolanaSelectedAccount()!;
    const navigation = useTypedNavigation();
    const { transaction, instructions, callback } = params;

    if (!transaction.feePayer) {
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
            const pending = await signAndSendSolanaTransaction({
                solanaClient,
                theme,
                authContext,
                transaction
            });
            ref.current = pending.id;
            registerPending(pending);
        } catch (error) {
            // TODO: *solana* humanize error ui
            Alert.alert('Error', (error as Error).message);
        }
        navigation.goBack();
    }, [theme, authContext, params, solanaAddress, navigation, registerPending]);

    useEffect(() => {
        callback?.(!!ref.current, ref.current);
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