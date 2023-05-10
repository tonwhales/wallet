import React from "react";
import { TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { WordInputRef, wordsTrie } from "../fragments/onboarding/WalletImportFragment";
import { t } from "../i18n/t";

function normalize(src: string) {
    return (src ?? '').trim().toLocaleLowerCase();
}

function checkWords(src: string) {
    const words = src.split(' ');
    return words.every(word => wordsTrie.contains(word));
}

export const SeedInput = React.memo(React.forwardRef((props: {
    value: string,
    autoFocus?: boolean,
    setValue: (src: string) => void,
    onSubmit: (value: string) => void,
    onFocus: () => void,
    innerRef: React.RefObject<View>,
}, ref: React.ForwardedRef<WordInputRef>) => {

    const [isWrong, setIsWrong] = React.useState(false);

    const tref = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        }
    }));

    //
    // Shake
    // 
    const translate = useSharedValue(0);
    const style = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translate.value }],
        };
    }, []);

    const doShake = React.useCallback(() => {
        translate.value = withSequence(
            withTiming(-10, { duration: 30 }),
            withRepeat(withTiming(10, { duration: 30 }), 2, true),
            withTiming(0, { duration: 30 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, []);

    const onBlur = React.useCallback(() => {
        const normalized = normalize(props.value);
        if (normalized.length > 0) {
            setIsWrong(!checkWords(normalized));
        }
    }, [props.value]);

    const onSubmit = React.useCallback(() => {
        const normalized = normalize(props.value);
        if (!checkWords(normalized)) {
            doShake();
            setIsWrong(true);
            return;
        }
        props.onSubmit(normalized);
    }, [props.value, props.onSubmit]);

    const onTextChange = React.useCallback((value: string) => {
        props.setValue(value);
        setIsWrong(false);
    }, [props.setValue]);

    return (
        <Animated.View style={style}>
            <View ref={props.innerRef} style={{ flexDirection: 'row' }} collapsable={false}>
                <TextInput
                    ref={tref}
                    numberOfLines={1}
                    style={{
                        paddingVertical: 16,
                        marginLeft: -8,
                        paddingLeft: 26,
                        paddingRight: 48,
                        flexGrow: 1,
                        fontSize: 16,
                        color: !isWrong ? '#000' : '#FF274E',
                    }}
                    value={props.value}
                    onChangeText={onTextChange}
                    placeholder={t('import.fullSeedPlaceholder')}
                    onBlur={onBlur}
                    returnKeyType={'done'}
                    autoComplete={'off'}
                    autoCorrect={false}
                    keyboardType={'ascii-capable'}
                    autoCapitalize={'none'}
                    onSubmitEditing={onSubmit}
                    blurOnSubmit={false}
                    autoFocus={props.autoFocus}
                    onFocus={props.onFocus}
                />
            </View>
        </Animated.View>
    )
}));