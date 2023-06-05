import * as React from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mnemonicValidate } from 'ton-crypto';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import Animated, { FadeOutDown, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { WalletSecureFragment } from './WalletSecureFragment';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { WordsListTrie } from '../../utils/wordsListTrie';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { warn } from '../../utils/log';
import { WalletWordsComponent } from '../../components/secure/WalletWordsComponent';
import { WalletSecurePasscodeFragment } from './WalletSecurePasscodeFragment';

export const wordsTrie = WordsListTrie();

export type WordInputRef = {
    focus: () => void;
}

export function normalize(src: string) {
    return src.trim().toLocaleLowerCase();
}

export const WordInput = React.memo(React.forwardRef((props: {
    index: number,
    value: string,
    autoFocus?: boolean,
    innerRef: React.RefObject<View>,
    setValue: (index: number, src: string) => void,
    onFocus: (index: number) => void,
    onSubmit: (index: number, value: string) => void,
}, ref: React.ForwardedRef<WordInputRef>) => {
    const { Theme } = useAppConfig();

    //
    // Internal state
    //

    const suggestions = React.useMemo(() => (props.value.length > 0) ? wordsTrie.find(normalize(props.value)) : [], [props.value]);
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

    //
    // External imperative functions
    //

    const tref = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        }
    }));

    //
    // Event handlers
    //

    // Forward focus event
    const onFocus = React.useCallback(() => {
        props.onFocus(props.index);
    }, [props.index]);

    // Update wrong state on blur (should we shake in case of failure?)
    const onBlur = React.useCallback(() => {
        const normalized = normalize(props.value);
        setIsWrong(normalized.length > 0 && !wordsTrie.contains(normalized));
    }, [props.value]);

    // Handle submit (enter press) action
    const onSubmit = React.useCallback(async () => {

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

    const onTextChange = React.useCallback((value: string) => {
        props.setValue(props.index, value);
        setIsWrong(false);
    }, [props.index, props.setValue]);

    return (
        <Animated.View style={style}>
            <View ref={props.innerRef} style={{ flexDirection: 'row' }} collapsable={false}>
                <Text
                    style={{
                        alignSelf: 'center',
                        fontSize: 16, width: 40,
                        paddingVertical: 16,
                        textAlign: 'right',
                        color: !isWrong ? Theme.textSubtitle : '#FF274E',
                    }}
                    onPress={() => {
                        tref.current?.focus();
                    }}
                >
                    {(props.index + 1)}.
                </Text>
                {Platform.OS === 'android' && (
                    <TouchableOpacity onPress={tref.current?.focus} activeOpacity={1} >
                        <TextInput
                            ref={tref}
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
                    </TouchableOpacity>
                )}
                {Platform.OS !== 'android' && (
                    <TextInput
                        ref={tref}
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
    const { Theme } = useAppConfig();
    const [state, setState] = React.useState<{
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    } | null>(null);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    React.useLayoutEffect(() => {
        if (!state) {
            navigation.setOptions({ headerStyle: { backgroundColor: Theme.background } });
        } else {
            navigation.setOptions({ headerStyle: { backgroundColor: Theme.item } });
        }
    }, [navigation, state]);

    return (
        <View
            style={{
                flexGrow: 1,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom ?? 0) + 16 : 0,
            }}
        >
            {!state && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center', flexGrow: 1,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                        backgroundColor: Platform.OS === 'android' ? Theme.background : undefined
                    }}
                    key="loading"
                    exiting={FadeOutDown}
                >
                    <AndroidToolbar style={{ backgroundColor: Theme.background }} />
                    <WalletWordsComponent onComplete={setState} />
                </Animated.View>
            )}
            {state && (
                <Animated.View
                    style={{ alignItems: 'stretch', justifyContent: 'center', flexGrow: 1 }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecurePasscodeFragment
                        mnemonics={state.mnemonics}
                        import={true}
                    />
                </Animated.View>
            )}
        </View>
    );
});