import { Platform, View, Text, InputAccessoryView, Alert } from "react-native"
import { fragment } from "../../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CloseButton } from "../../../components/CloseButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import React from "react";
import { WordInput, WordInputRef, normalize, wordsTrie } from "../../onboarding/WalletImportFragment";
import Animated, { measure, runOnUI, scrollTo, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { RoundButton } from "../../../components/RoundButton";
import { AutocompleteView } from "../../../components/AutocompleteView";
import { DeviceEncryption, getDeviceEncryption } from "../../../storage/getDeviceEncryption";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useKeyboard } from "@react-native-community/hooks";
import { mnemonicValidate } from "ton-crypto";
import { loadWalletKeys } from "../../../storage/walletKeys";
import { getCurrentAddress } from "../../../storage/appState";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { useEngine } from "../../../engine/Engine";
import { PasscodeState, passcodeEncKey } from "../../../storage/secureStorage";
import { storage } from "../../../storage/storage";

function WalletWordsComponent(props: {
    onComplete: (v: {
        mnemonics: string[],
        deviceEncryption: DeviceEncryption
    }) => void
}) {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const keyboard = useKeyboard();

    // References to all fields
    const animatedRefs: React.RefObject<View>[] = [];
    for (let i = 0; i < 25; i++) {
        animatedRefs.push(useAnimatedRef());
    }
    const refs = React.useMemo(() => {
        let r: React.RefObject<WordInputRef>[] = [];
        for (let i = 0; i < 25; i++) {
            r.push(React.createRef());
        }
        return r;
    }, []);

    // Words and suggestions
    const [fullSeed, setFullSeed] = React.useState('');
    const [words, setWords] = React.useState<string[]>([
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', ''
    ]);
    const [selectedWord, setSelectedWord] = React.useState(0);
    const suggestions = React.useMemo(() => {
        if (selectedWord === 24) {
            return [];
        }
        let w = normalize(words[selectedWord]);
        return (w.length > 0)
            ? wordsTrie.find(w)
            : [];
    }, [words[selectedWord]]);

    // Submit Callback (does not re-create during re-render)
    const wordsRef = React.useRef(words);
    const onSubmitEnd = React.useCallback(async () => {
        if (fullSeed.length !== 0) {
            const fullSeedWords = fullSeed.split(' ').map((v) => v.toLowerCase().trim());
            const isValidFull = await mnemonicValidate(fullSeedWords);
            if (!isValidFull) {
                Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
                return;
            }
            const deviceEncryption = await getDeviceEncryption();
            props.onComplete({ mnemonics: fullSeedWords, deviceEncryption });
            return;
        }
        let wordsLocal = wordsRef.current;
        let normalized = wordsLocal.map((v) => v.toLowerCase().trim());
        let isValid = await mnemonicValidate(normalized);
        if (!isValid) {
            Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
            return;
        }
        const deviceEncryption = await getDeviceEncryption();
        props.onComplete({ mnemonics: normalized, deviceEncryption });
    }, [fullSeed]);

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

    const onSeedFocus = React.useCallback(() => {
        runOnUI(scrollToInput)(24);
        setTimeout(() => {
            setSelectedWord(24);
        }, 600); // Wait for scroll animation to finish (hacky), 
        // so wierd bug with scrolling to bottom inputs starting from 20th
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

export const PasscodeResetFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const acc = getCurrentAddress();
    const engine = useEngine();
    const settings = engine?.products?.settings;

    const onWordsComplete = React.useCallback(async (v: {
        mnemonics: string[],
        deviceEncryption: DeviceEncryption
    }) => {
        const walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        if (walletKeys.mnemonics.join() !== v.mnemonics.join()) {
            Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
            return;
        }
        navigation.goBack();
        storage.delete(`${acc.address.toFriendly({ testOnly: engine.isTestnet })}/${passcodeEncKey}`);
        settings?.setPasscodeState(acc.address, PasscodeState.NotSet)
        navigation.navigate('PasscodeSetup');
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('security.passcodeSettings.resetTitle')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('security.passcodeSettings.resetTitle')}
                    </Text>
                </View>
            )}
            <View style={{ flexGrow: 1, justifyContent: 'center' }}>
                <WalletWordsComponent onComplete={onWordsComplete} />
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});