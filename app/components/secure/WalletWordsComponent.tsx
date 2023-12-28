import React from "react";
import { DeviceEncryption, getDeviceEncryption } from "../../storage/getDeviceEncryption";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboard } from "@react-native-community/hooks";
import Animated, { measure, runOnUI, useAnimatedRef, useAnimatedScrollHandler, useSharedValue, scrollTo, AnimatedRef } from "react-native-reanimated";
import { Alert, Platform, View, Text, InputAccessoryView } from "react-native";
import { WordInput, WordInputRef, normalize, wordsTrie } from "../../fragments/onboarding/WalletImportFragment";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { RoundButton } from "../RoundButton";
import { AutocompleteView } from "../AutocompleteView";
import { useTheme } from "../../engine/hooks";
import { mnemonicValidate } from "@ton/crypto";
import { randomEngLetter } from "../../utils/randomEngLetter";

export const WalletWordsComponent = React.memo((props: {
    onComplete: (v: {
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    }) => void,
}) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const keyboard = useKeyboard();

    // References to all fields
    const animatedRefs: AnimatedRef<View>[] = [];
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
            : wordsTrie.find(randomEngLetter());
    }, [selectedWord, words[selectedWord]]);

    // Submit Callback (does not re-create during re-render)
    const wordsRef = React.useRef(words);

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

        if (!container || !measured) {
            return;
        }

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
        if (value.split(' ').length === 24) {
            wordsRef.current = value.split(' ');
            setWords(value.split(' '));
            runOnUI(scrollToInput)(23);
            setSelectedWord(23);
            refs[23].current?.focus();
            return;
        }
        let r = [...wordsRef.current];
        r[index] = value;
        wordsRef.current = r;
        setWords(r);
    }, []);

    const onSubmit = React.useCallback(async (index: number, value: string) => {
        try {
            if (index === 0 && (value.split(' ').length === 24)) {
                const fullSeedWords = value.split(' ').map((v) => normalize(v));
                const isValidFull = await mnemonicValidate(fullSeedWords);
                if (!isValidFull) {
                    Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
                    return;
                }
                const deviceEncryption = await getDeviceEncryption();
                props.onComplete({ mnemonics: fullSeedWords.join(' '), deviceEncryption });
                return;
            }
        } catch (e) {
            warn('Failed to validate mnemonics');
            Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
            return;
        }
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
        wordComponents.push(
            <WordInput
                key={"word-" + i}
                index={i}
                innerRef={animatedRefs[i]}
                ref={refs[i]}
                value={words[i]}
                setValue={onSetValue}
                onFocus={onFocus}
                onSubmit={onSubmit}
            />
        );
    }

    return (
        <>
            <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }} ref={containerRef} collapsable={false}>
                <Animated.ScrollView
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                    contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                    contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - 32) : safeArea.bottom /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                    contentInsetAdjustmentBehavior="never"
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    automaticallyAdjustContentInsets={false}
                    ref={scrollRef}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                >
                    <Text style={{
                        alignSelf: 'center',
                        marginTop: 16, marginHorizontal: 16,
                        fontWeight: '600', fontSize: 32, lineHeight: 38,
                        color: theme.textPrimary, textAlign: 'center'
                    }}>
                        {t('import.title')}
                    </Text>
                    <Text style={{
                        alignSelf: 'center', textAlign: 'center',
                        marginTop: 15,
                        marginBottom: 16,
                        marginHorizontal: 37,
                        fontWeight: '400', fontSize: 16,
                        color: theme.textSecondary,
                    }}>
                        {t('import.subtitle')}
                    </Text>
                    <View style={{ width: '100%' }}>
                        {wordComponents}
                    </View>
                    <RoundButton
                        title={t('common.continue')}
                        action={onSubmitEnd}
                        style={[
                            { alignSelf: 'stretch', marginTop: 30 },
                            Platform.select({ android: { marginBottom: 16 + safeArea.bottom } })
                        ]}
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
});