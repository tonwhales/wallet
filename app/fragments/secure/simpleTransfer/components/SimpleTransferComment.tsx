import { Dispatch, forwardRef, memo, SetStateAction, useImperativeHandle, useRef } from "react";
import { Text, View } from "react-native";
import Animated, { LinearTransition, Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { ATextInput } from '../../../../components/ATextInput';
import { t } from '../../../../i18n/t';
import { useTheme } from '../../../../engine/hooks';
import { Typography } from '../../../../components/styles';
import { Cell } from '@ton/core';
import { KnownWallet } from "../../../../secure/KnownWallets";

type Props = {
    commentString: string;
    selected: "address" | "amount" | "comment" | null
    payload: Cell | null
    onInputFocus: (index: number) => void
    setComment: Dispatch<SetStateAction<string>>
    known: KnownWallet;
    commentError?: string;
}

export const Comment = memo(forwardRef(({
    commentString,
    selected,
    payload,
    onInputFocus,
    setComment,
    known,
    commentError,
}: Props, ref) => {
    const theme = useTheme();
    const innerRef = useRef(null)
    useImperativeHandle(ref, () => innerRef.current)
    
    return (
        <>
            <View style={{
                backgroundColor: theme.surfaceOnElevation,
                paddingVertical: 20,
                paddingHorizontal: (commentString.length > 0 && selected !== 'comment') ? 4 : 0,
                width: '100%', borderRadius: 20,
                overflow: 'hidden'
            }}>
                {payload ? (
                    <Text style={[{ color: theme.textPrimary, marginHorizontal: 16 }, Typography.regular17_24]}>
                        {t('transfer.smartContract')}
                    </Text>
                ) : (
                    <ATextInput
                        value={commentString}
                        index={2}
                        ref={innerRef}
                        onFocus={onInputFocus}
                        onValueChange={setComment}
                        placeholder={!!known ? t('transfer.commentRequired') : t('transfer.comment')}
                        keyboardType={'default'}
                        autoCapitalize={'sentences'}
                        label={!!known ? t('transfer.commentRequired') : t('transfer.comment')}
                        style={{ paddingHorizontal: 16 }}
                        inputStyle={[{ flexShrink: 1, color: theme.textPrimary, textAlignVertical: 'center' }, Typography.regular17_24]}
                        multiline
                        cursorColor={theme.accent}
                    />
                )}
            </View>
            {!!commentError ? (
                <Animated.View
                    style={{ marginTop: 2, marginLeft: 16 }}
                    entering={FadeInUp} exiting={FadeOutDown}
                    layout={LinearTransition.duration(200).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                >
                    <Text style={[{ color: theme.accentRed }, Typography.regular13_18]}>
                        {commentError}
                    </Text>
                </Animated.View>
            ) : ((selected === 'comment' && !known) && (
                <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
                    <Text style={[{ color: theme.textSecondary, paddingHorizontal: 16, marginTop: 2 }, Typography.regular13_18]}>
                        {t('transfer.commentDescription')}
                    </Text>
                </Animated.View>
            ))}
        </>
    )
}))
