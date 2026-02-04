import { memo } from "react";
import { Platform, View } from "react-native";
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { RoundButton } from '../../../../components/RoundButton';
import { t } from '../../../../i18n/t';
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
            keyboardVerticalOffset={Platform.select({ ios: safeArea.top + 24, android: 0 })}
        >
            <View style={{ marginHorizontal: 16 }}>
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
            </View>
        </KeyboardAvoidingView>
    )
})
