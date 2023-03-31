import * as React from 'react';
import { Alert, InputAccessoryView, Platform, Text, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import { RoundButton } from '../../components/RoundButton';
import { mnemonicValidate } from 'ton-crypto';
import { DeviceEncryption, getDeviceEncryption } from '../../storage/getDeviceEncryption';
import Animated, { FadeOutDown, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat, useAnimatedRef, useDerivedValue, measure, scrollTo, useAnimatedScrollHandler, runOnUI } from 'react-native-reanimated';
import { WalletSecureFragment } from './WalletSecureFragment';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { Theme } from '../../Theme';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { WordsListTrie } from '../../utils/wordsListTrie';
import { AutocompleteView } from '../../components/AutocompleteView';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';

const wordsTrie = WordsListTrie();

type WordInputRef = {
    focus: () => void;
}

function normalize(src: string) {
    return src.trim().toLocaleLowerCase();
}

const WordInput = React.memo(React.forwardRef((props: {
    index: number,
    value: string,
    autoFocus?: boolean,
    innerRef: React.RefObject<View>,
    setValue: (index: number, src: string) => void,
    onFocus: (index: number) => void,
    onSubmit: (index: number, value: string) => void,
}, ref: React.ForwardedRef<WordInputRef>) => {

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
        setIsWrong(normalized.length > 0 && wordsTrie.contains(normalized));
    }, [props.value]);

    // Handle submit (enter press) action
    const onSubmit = React.useCallback(() => {

        // Check if there are suggestions - replace them instead
        if (suggestions.length >= 1) {
            props.onSubmit(props.index, suggestions[0]);
            return;
        }

        // Check if value is invalid - shake and DO NOT forward onSubmit
        const normalized = normalize(props.value.trim());
        if (!wordsTrie.contains(normalized)) {
            doShake();
            setIsWrong(true);
            return;
        }

        // Word is valid - forward onSubmit
        props.onSubmit(props.index, normalized);
    }, [props.value, suggestions, props.onSubmit]);

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
            </View>
        </Animated.View>
    )
}));

function WalletWordsComponent(props: {
    onComplete: (v: {
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    }) => void
}) {
    const safeArea = useSafeAreaInsets();
    const keyboard = useKeyboard();

    // References to all fields
    const animatedRefs: React.RefObject<View>[] = [];
    for (let i = 0; i < 24; i++) {
        animatedRefs.push(useAnimatedRef());
    }
    const refs = React.useMemo(() => {
        let r: React.RefObject<WordInputRef>[] = [];
        for (let i = 0; i < 24; i++) {
            r.push(React.createRef());
        }
        return r;
    }, []);

    // Words and suggestions
    const [words, setWords] = React.useState<string[]>([
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', ''
    ]);
    const [selectedWord, setSelectedWord] = React.useState(0);
    const suggestions = React.useMemo(() => {
        let w = normalize(words[selectedWord]);
        return (w.length > 0)
            ? wordsTrie.find(w)
            : [];
    }, [words[selectedWord]]);

    // Submit Callback (does not re-create during re-render)
    const wordsRef = React.useRef(words);
    // React.useEffect(() => {
    //     wordsRef.current = words;
    // }, [words]);
    const onSubmitEnd = React.useCallback(async () => {
        let wordsLocal = wordsRef.current;
        let normalized = wordsLocal.map((v) => v.toLowerCase().trim());
        let isValid = await mnemonicValidate(normalized);
        if (!isValid) {
            Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
            return;
        }
        const deviceEncryption = await getDeviceEncryption();
        props.onComplete({ mnemonics: normalized.join(' '), deviceEncryption });
    }, []);

    //
    // Scroll state tracking
    //

    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<View>();
    const translationY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            translationY.value = event.contentOffset.y;
        }
    });

    // Keyboard height tracking
    const keyboardHeight = useSharedValue(keyboard.keyboardShown ? keyboard.keyboardHeight : 0);
    React.useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
        if (keyboard.keyboardShown) {
            runOnUI(scrollToInput)(selectedWord);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedWord]);

    //
    // Scrolling to active input
    //

    const scrollToInput = React.useCallback((index: number) => {
        'worklet';

        let ref = animatedRefs[index];
        let container = measure(containerRef);
        let measured = measure(ref);
        let scroll = translationY.value;

        let containerHeight = Platform.OS === 'ios' ? (container.height - keyboardHeight.value) : container.height;
        let relativeTop = measured.pageY - container.pageY;
        let relativeBottom = containerHeight - (relativeTop + measured.height);

        // If one of the last
        if (index > 20) {
            scrollTo(scrollRef, 0, 100000 /* Scroll to bottom */, true);
            return;
        }

        // If is behind top edge
        if (relativeTop < 0) {
            scrollTo(scrollRef, 0, scroll + relativeTop - 16 /* Scroll a little from the top */, true);
            return;
        }

        // If behind bottom edge
        if (relativeBottom < 0) {
            scrollTo(scrollRef, 0, scroll - relativeBottom + 16 /* Scroll a little from the top */, true);
            return;
        }

    }, []);

    //
    // Callbacks
    //

    const onFocus = React.useCallback((index: number) => {
        runOnUI(scrollToInput)(index);
        setSelectedWord(index);
    }, []);

    const onSetValue = React.useCallback((index: number, value: string) => {
        let r = [...wordsRef.current];
        r[index] = value;
        wordsRef.current = r;
        setWords(r);
    }, []);

    const onSubmit = React.useCallback((index: number, value: string) => {
        let r = [...wordsRef.current];
        r[index] = value;
        wordsRef.current = r;
        setWords(r);
        if (index === 23) {
            onSubmitEnd();
        } else {
            let next = refs[index + 1].current;
            if (next) {
                next.focus();
            }
        }
    }, []);

    const onSubmitSuggestion = React.useCallback((value: string) => {
        onSubmit(selectedWord, value);
    }, [selectedWord]);

    //
    // Components
    //

    let wordComponents: any[] = [];
    for (let i = 0; i < 24; i++) {
        wordComponents.push(<WordInput
            key={"word-" + i}
            index={i}
            innerRef={animatedRefs[i]}
            ref={refs[i]}
            value={words[i]}
            setValue={onSetValue}
            onFocus={onFocus}
            onSubmit={onSubmit}
        />);
        if (i < 23) {
            wordComponents.push(<View key={'sep-' + i} style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />);
        }
    }

    return (
        <>
            <StatusBar style='dark' />
            <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }} ref={containerRef} collapsable={false}>
                <Animated.ScrollView
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                    contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                    contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                    contentInsetAdjustmentBehavior="never"
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    automaticallyAdjustContentInsets={false}
                    ref={scrollRef}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                >
                    <Text style={{ alignSelf: 'center', marginTop: 5, marginHorizontal: 16, fontWeight: '800', fontSize: 26 }}>
                        {t('import.title')}
                    </Text>
                    <Text style={{
                        alignSelf: 'center', textAlign: 'center',
                        marginTop: 15,
                        marginBottom: 37,
                        marginHorizontal: 37,
                        fontWeight: '400', fontSize: 16,
                        color: 'rgba(109, 109, 113, 1)'
                    }}>
                        {t('import.subtitle')}
                    </Text>
                    <View style={{
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        width: '100%',
                    }}>
                        {wordComponents}
                    </View>
                    <RoundButton
                        title={t('common.continue')}
                        action={onSubmitEnd}
                        style={{ alignSelf: 'stretch', marginBottom: 16 + safeArea.bottom, marginTop: 30 }}
                    />
                </Animated.ScrollView>
            </View>

            {Platform.OS === 'android' && (
                <View style={{ paddingBottom: safeArea.bottom, flexDirection: 'column', alignSelf: 'stretch' }}>
                    <AutocompleteView
                        suggestions={suggestions}
                        onSelected={onSubmitSuggestion}
                    />
                </View>
            )}
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={'suggestions'}>
                    <View style={{ flexDirection: 'column', alignSelf: 'stretch' }}>
                        <AutocompleteView
                            suggestions={suggestions}
                            onSelected={onSubmitSuggestion}
                        />
                    </View>
                </InputAccessoryView>
            )}
        </>
    );
}

export const WalletImportFragment = systemFragment(() => {
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
        <>
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
                    <WalletSecureFragment
                        mnemonics={state.mnemonics}
                        deviceEncryption={state.deviceEncryption}
                        import={true}
                    />
                </Animated.View>
            )}
        </>
    );
});