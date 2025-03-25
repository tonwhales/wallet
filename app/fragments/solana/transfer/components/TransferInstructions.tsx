import { WalletResponse } from "@tonconnect/protocol";
import { parseTransactionInstructions } from "../../../../utils/solana/parseInstructions";
import { useRegisterPendingSolana, useSolanaClient, useSolanaSelectedAccount, useTheme } from "../../../../engine/hooks";
import { useKeysAuth } from "../../../../components/secure/AuthWalletKeys";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { Transaction } from "@solana/web3.js";
import { Alert, ScrollView, View } from "react-native";
import { TransferInstructionView } from "./TransferInstructionView";
import { RoundButton } from "../../../../components/RoundButton";
import { signAndSendSolanaTransaction } from "../../../../utils/solana/signAndSendSolanaTransaction";
import { useCallback } from "react";
import { t } from "../../../../i18n/t";

export const TransferInstructions = (params: {
    instructions: ReturnType<typeof parseTransactionInstructions>;
    transaction: string;
    callback?: (response: WalletResponse<'sendTransaction'>) => void
}) => {
    const theme = useTheme();
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
                    {params.instructions.map((instruction, index) => (
                        <TransferInstructionView
                            key={index}
                            instruction={instruction}
                            owner={solanaAddress}
                        />
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