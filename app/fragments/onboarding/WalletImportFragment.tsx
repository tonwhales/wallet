import * as React from 'react';
import { Alert, Platform, Text, View, TextInput as TextInputAndroid } from "react-native";
import * as Haptics from 'expo-haptics';
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import Animated, { FadeOutDown, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { WordsListTrie } from '../../utils/wordsListTrie';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { WalletWordsComponent } from '../../components/secure/WalletWordsComponent';
import { WalletSecurePasscodeComponent } from '../../components/secure/WalletSecurePasscodeComponent';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../engine/hooks';
import { mnemonicValidate } from '@ton/crypto';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useParams } from '../../utils/useParams';
import { StatusBar } from 'expo-status-bar';
import { Typography } from '../../components/styles';

export const wordsTrie = WordsListTrie();

export type WordInputRef = {
    focus: () => void;
}

export function normalize(src: string) {
    return src.trim().toLocaleLowerCase();
}

export const WordInput = memo(forwardRef((props: {
    index: number,
    value: string,
    autoFocus?: boolean,
    innerRef: RefObject<View>,
    setValue: (index: number, src: string) => void,
    onFocus: (index: number) => void,
    onSubmit: (index: number, value: string) => void,
}, ref: ForwardedRef<WordInputRef>) => {
    const theme = useTheme();

    //
    // Internal state
    //

    const suggestions = useMemo(() => (props.value.length > 0) ? wordsTrie.find(normalize(props.value)) : [], [props.value]);
    const [isWrong, setIsWrong] = useState(false);

    //
    // Shake
    // 
    const translate = useSharedValue(0);
    const animtedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translate.value }],
        };
    }, []);
    const doShake = useCallback(() => {
        translate.value = withSequence(
            withTiming(-10, { duration: 30 }),
            withRepeat(withTiming(10, { duration: 30 }), 2, true),
            withTiming(0, { duration: 30 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, []);

    //
    // External imperative functions
    //

    const tref = useRef<TextInput>(null);
    useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        }
    }));

    //
    // Event handlers
    //

    // Forward focus event
    const onFocus = useCallback(() => {
        props.onFocus(props.index);
    }, [props.index]);

    // Update wrong state on blur (should we shake in case of failure?)
    const onBlur = useCallback(() => {
        const normalized = normalize(props.value);
        setIsWrong(normalized.length > 0 && !wordsTrie.contains(normalized));
    }, [props.value]);

    // Handle submit (enter press) action
    const onSubmit = useCallback(async () => {

        // Check if there are suggestions - replace them instead
        if (suggestions.length >= 1) {
            props.onSubmit(props.index, suggestions[0]);
            return;
        }

        // Check if value is invalid - shake and DO NOT forward onSubmit
        const normalized = normalize(props.value.trim());

        try {
            if (props.index === 0 && normalized.split(' ').length === 24) {
                const fullSeedWords = normalized.split(' ').map((v) => normalize(v));
                const isValidFull = await mnemonicValidate(fullSeedWords);
                if (!isValidFull) {
                    doShake();
                    setIsWrong(true);
                    Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
                    return;
                }
                props.onSubmit(props.index, normalized);
                return;
            }
        } catch (e) {
            warn('Failed to validate mnemonics');
            doShake();
            setIsWrong(true);
            Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
            return;
        }

        if (!wordsTrie.contains(normalized)) {
            doShake();
            setIsWrong(true);
            return;
        }

        // Word is valid - forward onSubmit
        props.onSubmit(props.index, normalized);
    }, [props.value, suggestions, props.onSubmit, props.index]);

    const onTextChange = useCallback((value: string) => {
        props.setValue(props.index, value);
        setIsWrong(false);
    }, [props.index, props.setValue]);

    return (
        <Animated.View style={animtedStyle}>
            <View
                ref={props.innerRef}
                style={{
                    flexDirection: 'row',
                    backgroundColor: theme.border,
                    borderRadius: 16,
                    marginVertical: 8,
                    overflow: 'hidden'
                }}
                collapsable={false}
            >
                <Text
                    style={[
                        {
                            alignSelf: 'center',
                            width: 40,
                            paddingVertical: 14,
                            textAlign: 'right',
                            color: !isWrong ? theme.textSecondary : theme.accentRed,
                        },
                        Typography.medium17_24
                    ]}
                    onPress={() => {
                        tref.current?.focus();
                    }}
                >
                    {(props.index + 1)}:
                </Text>
                {Platform.OS === 'android' ? (
                    <TextInputAndroid
                        ref={tref}
                        style={{
                            paddingVertical: 16,
                            marginLeft: -16,
                            paddingLeft: 26,
                            paddingRight: 48,
                            flexGrow: 1,
                            fontSize: 17,
                            lineHeight: 24,
                            fontWeight: '400',
                            color: !isWrong ? theme.textPrimary : theme.accentRed,
                            width: '100%',
                            maxHeight: 56
                        }}
                        multiline={false}
                        numberOfLines={1}
                        value={props.value}
                        onChangeText={onTextChange}
                        onBlur={onBlur}
                        returnKeyType="next"
                        autoComplete='off'
                        autoCorrect={false}
                        keyboardType="ascii-capable"
                        autoCapitalize="none"
                        onFocus={onFocus}
                        onSubmitEditing={onSubmit}
                        blurOnSubmit={false}
                        inputAccessoryViewID={'suggestions'}
                        autoFocus={props.autoFocus}
                    />
                ) : (
                    <TextInput
                        ref={tref}
                        style={{
                            paddingVertical: 16,
                            marginLeft: -16,
                            paddingLeft: 26,
                            paddingRight: 48,
                            flexGrow: 1,
                            fontSize: 16,
                            color: !isWrong ? theme.textPrimary : theme.accentRed
                        }}
                        value={props.value}
                        onChangeText={onTextChange}
                        onBlur={onBlur}
                        returnKeyType="next"
                        autoComplete='off'
                        autoCorrect={false}
                        keyboardType="ascii-capable"
                        autoCapitalize="none"
                        onFocus={onFocus}
                        onSubmitEditing={onSubmit}
                        blurOnSubmit={false}
                        inputAccessoryViewID={'suggestions'}
                        autoFocus={props.autoFocus}
                    />
                )}
            </View>
        </Animated.View>
    )
}));

export const WalletImportFragment = systemFragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { additionalWallet } = useParams<{ additionalWallet?: boolean }>();
    const [state, setState] = useState<{
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    } | null>(null);
    const safeArea = useSafeAreaInsets();

    return (
        <View
            style={{
                flexGrow: 1,
                ...Platform.select({
                    ios: {
                        paddingBottom: state ? (safeArea.bottom === 0 ? 32 : safeArea.bottom) + 16 : 0,
                        paddingTop: state ? 0 : 32,
                    }
                }),
            }}
        >
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            {!state && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center', flexGrow: 1,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                    }}
                    key={'loading'}
                    exiting={FadeOutDown}
                >
                    <ScreenHeader style={{ paddingHorizontal: 16 }} onBackPressed={navigation.goBack} />
                    <WalletWordsComponent onComplete={setState} />
                </Animated.View>
            )}
            {state && (
                <Animated.View
                    style={{ alignItems: 'stretch', justifyContent: 'center', flexGrow: 1 }}
                    key={'content'}
                    entering={FadeIn}
                >
                    <WalletSecurePasscodeComponent
                        mnemonics={state.mnemonics}
                        import={true}
                        onBack={() => setState(null)}
                        additionalWallet={additionalWallet}
                    />
                </Animated.View>
            )}
        </View>
    );
});