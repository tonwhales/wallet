import * as React from 'react';
import { Alert, Platform, Text, View } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { iOSColors, iOSUIKit } from "react-native-typography";
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

type WordInputRef = {
    focus: () => void;
}

const WordInput = React.memo(React.forwardRef((props: {
    hint: string,
    value: string,
    setValue: (src: string) => void,
    next?: React.RefObject<WordInputRef>,
    scroll: React.RefObject<ScrollView>,
}, ref: React.ForwardedRef<WordInputRef>) => {

    // Shake
    const translate = useSharedValue(0);
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
            vref.current!.measureLayout(props.scroll.current! as any, (left: number, top: number, width: number, height: number) => {
                props.scroll.current!.scrollTo({ y: top - height / 2 - 58, animated: true });
            }, () => {
                // Ignore
            });
        });
    }, []);

    const onSubmit = React.useCallback(() => {
        const normalized = props.value.trim().toLowerCase();
        if (!wordlist.find((v) => v === normalized)) {
            translate.value = withSequence(
                withTiming(-10, { duration: 30 }),
                withRepeat(withTiming(10, { duration: 30 }), 2, true),
                withTiming(0, { duration: 30 })
            );
            return;
        }
        props.next?.current?.focus();
    }, [props.value]);

    const onTextChange = React.useCallback((value: string) => {
        if (value.length >= 3) {
            const autocomplite = wordlist.find((w) => w.startsWith(value));
            if (autocomplite && autocomplite !== props.value) {
                props.setValue(autocomplite);
                setTimeout(() => {
                    tref.current?.setNativeProps({
                        selection: {
                            start: value.length,
                            end: autocomplite.length
                        },
                    })
                }, 10);
            }
        } else {
            props.setValue(value);
        }
    }, [tref]);

    return (
        <Animated.View style={style}>
            <View
                ref={vref}
                style={{
                    marginVertical: 8,
                    backgroundColor: iOSColors.customGray,
                    height: 50,
                    width: 300,
                    borderRadius: 25,
                    flexDirection: 'row'
                }}
            >
                <Text style={{ alignSelf: 'center', fontSize: 18, width: 40, textAlign: 'right' }}>{props.hint}.</Text>
                <TextInput
                    ref={tref}
                    style={{
                        height: 50,
                        marginLeft: -20,
                        paddingLeft: 26,
                        paddingRight: 48,
                        flexGrow: 1,
                        fontSize: 18
                    }}
                    value={props.value}
                    onChangeText={onTextChange}
                    returnKeyType="next"
                    autoCompleteType="off"
                    autoCorrect={false}
                    keyboardType="ascii-capable"
                    autoCapitalize="none"
                    inputAccessoryViewID="autocomplete"
                    onFocus={onFocus}
                    onSubmitEditing={onSubmit}
                    blurOnSubmit={false}
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
        <ScrollView
            style={{ flexGrow: 1, backgroundColor: 'white' }}
            contentContainerStyle={{ alignItems: 'center' }}
            contentInset={{ bottom: keyboard.keyboardShown ? keyboard.keyboardHeight : safeArea.bottom }}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            ref={scrollRef}
        >
            <Text style={[iOSUIKit.largeTitleEmphasized, { alignSelf: 'center', marginTop: 16, marginHorizontal: 16 }]}>{t("24 Secret Words")}</Text>
            <Text style={[iOSUIKit.body, { alignSelf: 'center', textAlign: 'center', marginTop: 16, marginHorizontal: 16, marginBottom: 16 }]}>
                {t("Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet.")}
            </Text>
            <WordInput ref={w1Ref} next={w2Ref} scroll={scrollRef} hint="1" value={w1} setValue={setW1} />
            <WordInput ref={w2Ref} next={w3Ref} scroll={scrollRef} hint="2" value={w2} setValue={setW2} />
            <WordInput ref={w3Ref} next={w4Ref} scroll={scrollRef} hint="3" value={w3} setValue={setW3} />
            <WordInput ref={w4Ref} next={w5Ref} scroll={scrollRef} hint="4" value={w4} setValue={setW4} />
            <WordInput ref={w5Ref} next={w6Ref} scroll={scrollRef} hint="5" value={w5} setValue={setW5} />
            <WordInput ref={w6Ref} next={w7Ref} scroll={scrollRef} hint="6" value={w6} setValue={setW6} />
            <WordInput ref={w7Ref} next={w8Ref} scroll={scrollRef} hint="7" value={w7} setValue={setW7} />
            <WordInput ref={w8Ref} next={w9Ref} scroll={scrollRef} hint="8" value={w8} setValue={setW8} />
            <WordInput ref={w9Ref} next={w10Ref} scroll={scrollRef} hint="9" value={w9} setValue={setW9} />
            <WordInput ref={w10Ref} next={w11Ref} scroll={scrollRef} hint="10" value={w10} setValue={setW10} />
            <WordInput ref={w11Ref} next={w12Ref} scroll={scrollRef} hint="11" value={w11} setValue={setW11} />
            <WordInput ref={w12Ref} next={w13Ref} scroll={scrollRef} hint="12" value={w12} setValue={setW12} />
            <WordInput ref={w13Ref} next={w14Ref} scroll={scrollRef} hint="13" value={w13} setValue={setW13} />
            <WordInput ref={w14Ref} next={w15Ref} scroll={scrollRef} hint="14" value={w14} setValue={setW14} />
            <WordInput ref={w15Ref} next={w16Ref} scroll={scrollRef} hint="15" value={w15} setValue={setW15} />
            <WordInput ref={w16Ref} next={w17Ref} scroll={scrollRef} hint="16" value={w16} setValue={setW16} />
            <WordInput ref={w17Ref} next={w18Ref} scroll={scrollRef} hint="17" value={w17} setValue={setW17} />
            <WordInput ref={w18Ref} next={w19Ref} scroll={scrollRef} hint="18" value={w18} setValue={setW18} />
            <WordInput ref={w19Ref} next={w20Ref} scroll={scrollRef} hint="19" value={w19} setValue={setW19} />
            <WordInput ref={w20Ref} next={w21Ref} scroll={scrollRef} hint="20" value={w20} setValue={setW20} />
            <WordInput ref={w21Ref} next={w22Ref} scroll={scrollRef} hint="21" value={w21} setValue={setW21} />
            <WordInput ref={w22Ref} next={w23Ref} scroll={scrollRef} hint="22" value={w22} setValue={setW22} />
            <WordInput ref={w23Ref} next={w24Ref} scroll={scrollRef} hint="23" value={w23} setValue={setW23} />
            <WordInput ref={w24Ref} hint="24" scroll={scrollRef} value={w24} setValue={setW24} />
            <RoundButton title={t("Continue")} action={onSubmit} style={{ alignSelf: 'stretch', marginHorizontal: 64, marginVertical: 32 }} />
        </ScrollView>
    );
}

export const WalletImportFragment = fragment(() => {
    const [state, setState] = React.useState<{
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    } | null>(null);
    const safeArea = useSafeAreaInsets();
    return (
        <>
            {!state && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center', flexGrow: 1,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                        backgroundColor: Platform.OS === 'android' ? 'white' : undefined
                    }}
                    key="loading"
                    exiting={FadeOutDown}
                >
                    <AndroidToolbar />
                    <WalletWordsComponent onComplete={setState} />
                </Animated.View>
            )}
            {state && (
                <Animated.View
                    style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
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