import * as React from 'react';
import { Alert, findNodeHandle, Platform, Text, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fragment } from "../../fragment";
import { useKeyboard } from '@react-native-community/hooks';
import { RoundButton } from '../../components/RoundButton';
import { wordlist } from 'ton-crypto/dist/mnemonic/wordlist';
import { mnemonicValidate } from 'ton-crypto';
import { DeviceEncryption, getDeviceEncryption } from '../../utils/getDeviceEncryption';
import Animated, { FadeOutDown, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { WalletSecureFragment } from './WalletSecureFragment';
import { useTranslation } from 'react-i18next';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { Theme } from '../../Theme';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AutocompliteAccessoryView } from '../../components/AutocompliteAccessoryView';
import { FocusedInputLoader, useFocusedInput } from '../../components/AndroidInputAccessoryView/hooks/useFocusedInput';
import { AndroidInputAccessoryView } from '../../components/AndroidInputAccessoryView/AndroidInputAccessoryView';
import { StatusBar } from 'expo-status-bar';

type WordInputRef = {
    focus: () => void;
}

const WordInput = React.memo(React.forwardRef((props: {
    hint: string,
    value: string,
    setValue: (src: string) => void,
    onSubmit?: (value?: string) => void,
    next?: React.RefObject<WordInputRef>,
    scroll: React.RefObject<ScrollView>,
    inputAccessoryViewID?: string,
    contentOffsetY: number
}, ref: React.ForwardedRef<WordInputRef>) => {
    const keyboard = useKeyboard();
    const inputAccessoryViewID = `id-${props.hint}-${props.inputAccessoryViewID}`;
    const { setCurrent } = useFocusedInput();

    // Shake
    const translate = useSharedValue(0);
    const [isWrong, setIsWrong] = React.useState(false);
    const [selection, setSelection] = React.useState<{
        start: number;
        end: number;
    }>();
    const style = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translate.value }],
        };
    }, []);

    const vref = React.useRef<View>(null);
    const tref = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        }
    }));
    const onFocus = React.useCallback(() => {
        vref.current!.measure((
            scrollX: number,
            scrollY: number,
            scrollWidth: number,
            scrollHeight: number,
            scrollPageX: number,
            scrollPageY: number
        ) => {
            props.scroll.current
            vref.current!.measureLayout(props.scroll.current! as any, (left: number, top: number, width: number, viewHeight: number) => {
                // Viewbox is within margin values, 
                // from top: viewHeight & from bottom: keyboardHeight + accessoryViews height

                // Input is out of 'viewbox' bound from top
                if (top - viewHeight - props.contentOffsetY < 0) {
                    props.scroll.current!.scrollTo({
                        y: top - viewHeight,
                        animated: true
                    });
                } else if (top - props.contentOffsetY - keyboard.keyboardHeight - 50 > 0) {
                    // Input is out of 'viewbox' bound from bottom
                    props.scroll.current!.scrollResponderScrollNativeHandleToKeyboard(
                        findNodeHandle(vref.current),
                        viewHeight * 2 + 50
                    );
                }
            }, () => {
                // Ignore
            });
            if (Platform.OS === 'android') setCurrent({ value: props.value, onSetValue: props.setValue });
        });
    }, [keyboard, props.contentOffsetY]);

    const suggestions = (props.value && props.value?.length > 0)
        ? wordlist.filter((w) => w.startsWith(props.value!))
        : [];

    const onBlur = React.useCallback(() => {
        const normalized = props.value.trim().toLowerCase();
        if (Platform.OS === 'android') setCurrent(undefined);
        if (!wordlist.find((v) => v === normalized) && normalized.length > 0) {
            setIsWrong(true);
        }
    }, [props.value]);

    const onSubmit = React.useCallback((value?: string) => {
        if (suggestions.length >= 1 && !value) {
            props.setValue(suggestions[0]);
            if (Platform.OS === 'android') setCurrent(undefined);
            props.next?.current?.focus();
            return;
        }
        const normalized = value ? value.trim().toLowerCase() : props.value.trim().toLowerCase();
        if (!wordlist.find((v) => v === normalized)) {
            translate.value = withSequence(
                withTiming(-10, { duration: 30 }),
                withRepeat(withTiming(10, { duration: 30 }), 2, true),
                withTiming(0, { duration: 30 })
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsWrong(true);
            return;
        }
        props.setValue(normalized);
        if (Platform.OS === 'android') setCurrent(undefined);
        props.next?.current?.focus();
        if (props.onSubmit) {
            console.log('onSubmit');
            props.onSubmit();
        }
    }, [props.value, suggestions, props.onSubmit]);

    const onTextChange = React.useCallback((value: string) => {
        setIsWrong(false);
        if (value.length >= 4) {
            const autocomplite = wordlist.find((w) => w.startsWith(value));
            if (autocomplite && autocomplite !== props.value) {
                props.setValue(autocomplite);
                if (Platform.OS === 'android') setCurrent({ value: autocomplite, onSetValue: props.setValue });
                setTimeout(() => {
                    const selection = {
                        start: value.length,
                        end: autocomplite.length
                    }
                    setSelection(selection)
                    tref.current?.setNativeProps({
                        selection: selection,
                    });
                }, 1);
            } else {
                props.setValue(value);
                if (Platform.OS === 'android') setCurrent({ value: value, onSetValue: props.setValue });
                tref.current?.setNativeProps({
                    selection: {
                        start: value.length,
                        end: value.length
                    },
                });
            }
        } else {
            if (Platform.OS === 'android') setCurrent({ value: value, onSetValue: props.setValue });
            props.setValue(value);
            tref.current?.setNativeProps({
                selection: {
                    start: value.length,
                    end: value.length
                },
            });
        }
    }, [tref, props.value, setCurrent, props.setValue]);

    return (
        <Animated.View style={style}>
            <View
                ref={vref}
                style={{ flexDirection: 'row' }}
            >
                <Text
                    style={{
                        alignSelf: 'center',
                        fontSize: 16, width: 40,
                        paddingVertical: 16,
                        textAlign: 'right',
                        color: !isWrong ? '#8E979D' : '#FF274E',
                    }}
                    onPress={() => {
                        tref.current?.focus();
                    }}
                >
                    {props.hint}.
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
                    onKeyPress={(event) => {
                        if (event.nativeEvent.key === 'Backspace') {
                            event.preventDefault();
                        }
                    }}
                    onSelectionChange={(e) => {
                        if (e.nativeEvent.selection) {
                            setSelection(e.nativeEvent.selection);
                        }
                    }}
                    onBlur={onBlur}
                    returnKeyType="next"
                    autoCompleteType="off"
                    autoCorrect={false}
                    keyboardType="ascii-capable"
                    autoCapitalize="none"
                    onFocus={onFocus}
                    onSubmitEditing={() => onSubmit()}
                    blurOnSubmit={false}
                    inputAccessoryViewID={inputAccessoryViewID}
                />
                <AutocompliteAccessoryView
                    suggestions={suggestions}
                    setValue={onSubmit}
                    inputAccessoryViewID={inputAccessoryViewID}
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
    const [contentOffsetY, setContentOffsetY] = React.useState(0);
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const keyboard = useKeyboard();
    const scrollRef = React.useRef<ScrollView>(null);
    const w1Ref = React.useRef<WordInputRef>(null);
    const w2Ref = React.useRef<WordInputRef>(null);
    const w3Ref = React.useRef<WordInputRef>(null);
    const w4Ref = React.useRef<WordInputRef>(null);
    const w5Ref = React.useRef<WordInputRef>(null);
    const w6Ref = React.useRef<WordInputRef>(null);
    const w7Ref = React.useRef<WordInputRef>(null);
    const w8Ref = React.useRef<WordInputRef>(null);
    const w9Ref = React.useRef<WordInputRef>(null);
    const w10Ref = React.useRef<WordInputRef>(null);
    const w11Ref = React.useRef<WordInputRef>(null);
    const w12Ref = React.useRef<WordInputRef>(null);
    const w13Ref = React.useRef<WordInputRef>(null);
    const w14Ref = React.useRef<WordInputRef>(null);
    const w15Ref = React.useRef<WordInputRef>(null);
    const w16Ref = React.useRef<WordInputRef>(null);
    const w17Ref = React.useRef<WordInputRef>(null);
    const w18Ref = React.useRef<WordInputRef>(null);
    const w19Ref = React.useRef<WordInputRef>(null);
    const w20Ref = React.useRef<WordInputRef>(null);
    const w21Ref = React.useRef<WordInputRef>(null);
    const w22Ref = React.useRef<WordInputRef>(null);
    const w23Ref = React.useRef<WordInputRef>(null);
    const w24Ref = React.useRef<WordInputRef>(null);
    const [w1, setW1] = React.useState('');
    const [w2, setW2] = React.useState('');
    const [w3, setW3] = React.useState('');
    const [w4, setW4] = React.useState('');
    const [w5, setW5] = React.useState('');
    const [w6, setW6] = React.useState('');
    const [w7, setW7] = React.useState('');
    const [w8, setW8] = React.useState('');
    const [w9, setW9] = React.useState('');
    const [w10, setW10] = React.useState('');
    const [w11, setW11] = React.useState('');
    const [w12, setW12] = React.useState('');
    const [w13, setW13] = React.useState('');
    const [w14, setW14] = React.useState('');
    const [w15, setW15] = React.useState('');
    const [w16, setW16] = React.useState('');
    const [w17, setW17] = React.useState('');
    const [w18, setW18] = React.useState('');
    const [w19, setW19] = React.useState('');
    const [w20, setW20] = React.useState('');
    const [w21, setW21] = React.useState('');
    const [w22, setW22] = React.useState('');
    const [w23, setW23] = React.useState('');
    const [w24, setW24] = React.useState('');

    const onSubmit = async () => {
        const words = [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15, w16, w17, w18, w19, w20, w21, w22, w23, w24];
        let isValid = await mnemonicValidate(words);
        if (!isValid) {
            Alert.alert(t('Incorrect words'), 'You have entered incorrect secret words. Please, double ckeck your input and try again.');
            return;
        }
        const deviceEncryption = await getDeviceEncryption();
        props.onComplete({ mnemonics: words.join(' ').toLowerCase(), deviceEncryption });
    };

    return (
        <>
            <FocusedInputLoader>
                <StatusBar style='dark' />
                <ScrollView
                    style={{ flexGrow: 1, backgroundColor: Theme.background, alignSelf: 'stretch' }}
                    contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                    contentInset={{ bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - safeArea.bottom - 30 : safeArea.bottom + 30 }}
                    contentInsetAdjustmentBehavior="never"
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                    ref={scrollRef}
                    scrollEventThrottle={16}
                    onScroll={(event) => { setContentOffsetY(event.nativeEvent.contentOffset.y); }}
                >
                    <Text style={{ alignSelf: 'center', marginTop: 92, marginHorizontal: 16, fontWeight: '800', fontSize: 26 }}>
                        {t("24 Secret Words")}
                    </Text>
                    <Text style={{
                        alignSelf: 'center', textAlign: 'center',
                        marginTop: 15,
                        marginBottom: 37,
                        marginHorizontal: 37,
                        fontWeight: '400', fontSize: 16,
                        color: 'rgba(109, 109, 113, 1)'
                    }}>
                        {t("Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet.")}
                    </Text>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 14,
                        width: '100%',
                    }}>
                        <WordInput contentOffsetY={contentOffsetY} ref={w1Ref} next={w2Ref} scroll={scrollRef} hint="1" value={w1} setValue={setW1} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w2Ref} next={w3Ref} scroll={scrollRef} hint="2" value={w2} setValue={setW2} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w3Ref} next={w4Ref} scroll={scrollRef} hint="3" value={w3} setValue={setW3} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w4Ref} next={w5Ref} scroll={scrollRef} hint="4" value={w4} setValue={setW4} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w5Ref} next={w6Ref} scroll={scrollRef} hint="5" value={w5} setValue={setW5} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w6Ref} next={w7Ref} scroll={scrollRef} hint="6" value={w6} setValue={setW6} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w7Ref} next={w8Ref} scroll={scrollRef} hint="7" value={w7} setValue={setW7} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w8Ref} next={w9Ref} scroll={scrollRef} hint="8" value={w8} setValue={setW8} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w9Ref} next={w10Ref} scroll={scrollRef} hint="9" value={w9} setValue={setW9} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w10Ref} next={w11Ref} scroll={scrollRef} hint="10" value={w10} setValue={setW10} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w11Ref} next={w12Ref} scroll={scrollRef} hint="11" value={w11} setValue={setW11} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w12Ref} next={w13Ref} scroll={scrollRef} hint="12" value={w12} setValue={setW12} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w13Ref} next={w14Ref} scroll={scrollRef} hint="13" value={w13} setValue={setW13} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w14Ref} next={w15Ref} scroll={scrollRef} hint="14" value={w14} setValue={setW14} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w15Ref} next={w16Ref} scroll={scrollRef} hint="15" value={w15} setValue={setW15} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w16Ref} next={w17Ref} scroll={scrollRef} hint="16" value={w16} setValue={setW16} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w17Ref} next={w18Ref} scroll={scrollRef} hint="17" value={w17} setValue={setW17} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w18Ref} next={w19Ref} scroll={scrollRef} hint="18" value={w18} setValue={setW18} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w19Ref} next={w20Ref} scroll={scrollRef} hint="19" value={w19} setValue={setW19} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w20Ref} next={w21Ref} scroll={scrollRef} hint="20" value={w20} setValue={setW20} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w21Ref} next={w22Ref} scroll={scrollRef} hint="21" value={w21} setValue={setW21} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w22Ref} next={w23Ref} scroll={scrollRef} hint="22" value={w22} setValue={setW22} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w23Ref} next={w24Ref} scroll={scrollRef} hint="23" value={w23} setValue={setW23} />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 17 }} />
                        <WordInput contentOffsetY={contentOffsetY} ref={w24Ref} hint="24" scroll={scrollRef} value={w24} setValue={setW24} onSubmit={onSubmit} />
                    </View>
                    <RoundButton
                        title={t("Continue")}
                        action={onSubmit}
                        style={{ alignSelf: 'stretch', marginBottom: safeArea.bottom + 30 + 16, marginTop: 30 }}
                    />
                </ScrollView>
                <AndroidInputAccessoryView />
            </FocusedInputLoader>
        </>
    );
}

export const WalletImportFragment = fragment(() => {
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
            navigation.setOptions({ headerStyle: { backgroundColor: 'white' } });
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