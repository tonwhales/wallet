import React from "react";
import { View, Text, TextInput } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import { wordsTrie } from "../fragments/onboarding/WalletImportFragment";
import { Theme } from "../Theme";
import { t } from "../i18n/t";

function normalize(src: string) {
    return src.toLocaleLowerCase();
}

function checkWords(src: string) {
    const words = src.split(' ');
    return words.every(word => wordsTrie.contains(word));
}

export const SeedInput = React.memo((props: {
    value: string,
    autoFocus?: boolean,
    setValue: (src: string) => void,
    onSubmit: (value: string) => void,
}) => {
    // const { Theme } = useAppConfig();
    const [isWrong, setIsWrong] = React.useState(false);

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
            <TextInput
                style={{
                    paddingVertical: 16,
                    marginLeft: -16,
                    paddingLeft: 26,
                    paddingRight: 48,
                    flexGrow: 1,
                    fontSize: 16,
                    color: !isWrong ? '#000' : '#FF274E'
                }}
                value={props.value}
                onChangeText={onTextChange}
                placeholder={t('import.fullSeedPlaceholder')}
                onBlur={onBlur}
                returnKeyType="next"
                autoComplete='off'
                autoCorrect={false}
                keyboardType="ascii-capable"
                autoCapitalize="none"
                onSubmitEditing={onSubmit}
                blurOnSubmit={false}
                autoFocus={props.autoFocus}
            />
        </Animated.View>
    )
});