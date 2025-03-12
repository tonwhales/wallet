import { memo } from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../../../components/RoundButton';
import { t } from '../../../../i18n/t';

type Props = {
    selected: "address" | "amount" | "comment" | null
    onNext: (() => void) | null
    continueDisabled: boolean;
    continueLoading?: boolean;
    doSend: () => Promise<void>
}

export const SimpleTransferFooter = memo(({
    selected,
    onNext,
    continueDisabled,
    continueLoading,
    doSend,
}: Props) => {
    const safeArea = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : undefined}
            style={[
                { marginHorizontal: 16, marginTop: 16, },
                Platform.select({
                    android: { marginBottom: safeArea.bottom + 16 },
                    ios: { marginBottom: safeArea.bottom + 32 }
                })
            ]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 0}
        >
            {!!selected
                ? <RoundButton
                    title={t('common.save')}
                    disabled={!onNext}
                    onPress={onNext ? onNext : undefined}
                />
                : <RoundButton
                    disabled={continueDisabled}
                    loading={continueLoading}
                    title={t('common.continue')}
                    action={doSend}
                />
            }
        </KeyboardAvoidingView>
    )
})
