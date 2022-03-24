import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Switch, Text, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { BiometryComponent } from "../components/Security/BiometryComponent";
import { PasscodeComponent } from "../components/Security/PasscodeComponent";
import { fragment } from "../fragment";
import { Settings } from "../storage/settings";
import { Theme } from "../Theme";
import { useAuth } from "../utils/AuthContext";

export const SecurityFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const baseNavigation = useNavigation();

    const [usePasscode, setUsePasscode] = useState(!!Settings.getPasscode());
    const [passcodeState, setPasscodeState] = useState<{
        type?: 'confirm' | 'new' | 'change',
        onSuccess?: () => void,
    }>();

    const onUsePasscodeChange = useCallback(
        (newVal: boolean) => {
            if (newVal) {
                setPasscodeState({
                    type: 'new',
                    onSuccess: () => {
                        setPasscodeState(undefined);
                        setUsePasscode(true);
                    }
                });
                return;
            }
            setPasscodeState({
                type: 'confirm',
                onSuccess: () => {
                    setPasscodeState(undefined);
                    Settings.clearPasscode();
                    setUsePasscode(false);
                }
            });
        },
        [passcodeState],
    );

    const onChangePasscode = useCallback(
        () => {
            if (usePasscode) {
                setPasscodeState({
                    type: 'change',
                    onSuccess: () => {
                        setPasscodeState(undefined);
                    }
                });
            }
        },
        [usePasscode],
    );


    useEffect(() => {
        if (Platform.OS === 'ios') {
            if (!passcodeState?.type) {
                baseNavigation.setOptions({
                    headerStyle: { backgroundColor: Theme.background },
                    headerBackVisible: true,
                    title: t('security.title'),
                    // headerRight: null
                });
            } else {
                baseNavigation.setOptions({
                    headerShow: false,
                    headerBackVisible: false,
                    title: '',
                    // headerRight: () => {
                    //     return (
                    //         <Pressable
                    //             style={({ pressed }) => [
                    //                 { opacity: pressed ? 0.3 : 1 },
                    //             ]}
                    //             onPress={() => setPasscodeState(undefined)}
                    //         >
                    //             <Image source={require('../../assets/ic_close.png')} />
                    //         </Pressable>
                    //     );
                    // }
                });
            }
        }
    }, [passcodeState]);

    const auth = useAuth();

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0
        }}>
            {!passcodeState?.type && (<AndroidToolbar pageTitle={t('security.title')} />)}
            <StatusBar style="dark" />
            <View style={{ paddingHorizontal: 16, flexGrow: 1 }}>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: "white",
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    <View style={{
                        marginHorizontal: 16, height: 48,
                        width: '100%', flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Pressable
                            style={({ pressed }) => {
                                return [{
                                    flexGrow: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    opacity: pressed ? 0.3 : 1,
                                    borderRadius: 8,
                                    padding: 6
                                }]
                            }}
                            onPress={() => {
                                onUsePasscodeChange(!usePasscode)
                            }}
                        >
                            <Image style={{ height: 24, width: 24 }} source={require('../../assets/ic_passcode.png')} />
                            <View style={{
                                flexDirection: 'row',
                                flexGrow: 1,
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Text style={{
                                    fontSize: 17,
                                    textAlignVertical: 'center',
                                    color: Theme.textColor,
                                    marginLeft: 8,
                                    lineHeight: 24,
                                }}>
                                    {t('security.passcode.use')}
                                </Text>
                                <Switch
                                    trackColor={{ false: '#f4f3f4', true: Platform.OS === 'android' ? Theme.accent : '#4FAE42' }}
                                    thumbColor={'white'}
                                    ios_backgroundColor={usePasscode ? '#4FAE42' : "#f4f3f4"}
                                    onValueChange={onUsePasscodeChange}
                                    value={usePasscode}
                                />
                            </View>
                        </Pressable>
                    </View>
                    {usePasscode && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                            <View style={{ marginHorizontal: 16, padding: 6, height: 48, width: '100%', flexDirection: 'row', }}>
                                <Pressable
                                    style={({ pressed }) => {
                                        return [{
                                            flexGrow: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            opacity: pressed ? 0.3 : 1,
                                            borderRadius: 8
                                        }]
                                    }}
                                    onPress={onChangePasscode}
                                >
                                    <Image style={{ height: 24, width: 24 }} source={require('../../assets/ic_reset_passcode.png')} />
                                    <Text style={{
                                        fontSize: 17,
                                        textAlignVertical: 'center',
                                        color: Theme.textColor,
                                        marginLeft: 8,
                                        lineHeight: 24,
                                    }}>
                                        {t('security.passcode.change')}
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    )}
                    <BiometryComponent />
                </View>
                <PasscodeComponent
                    type={passcodeState?.type}
                    onSuccess={passcodeState?.onSuccess}
                    onCancel={() => {
                        setPasscodeState(undefined);
                    }}
                />
            </View>
        </View>
    );
});