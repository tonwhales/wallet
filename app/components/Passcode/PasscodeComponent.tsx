import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { View, TextInput, Text, Pressable, Image } from "react-native"
import { Settings } from "../../storage/settings";
import { Theme } from "../../Theme";
import { PasscodeInput } from "./PasscodeInput";

export const PasscodeComponent = React.memo((props: {
    type?: 'confirm' | 'new',
    onSuccess?: () => void,
    onCancel?: () => void
}) => {
    if (!props.type) return null;

    const { t } = useTranslation();
    const [error, setError] = useState<string>();
    console.log(props);

    const [screenState, setScreenState] = useState<{
        pass?: {
            value?: string,
            confirmValue?: string
        },
        type?: 'reenter' | 'new'
    }>({ type: props.type === 'new' ? 'new' : undefined });

    const onChange = useCallback(
        (pass: string) => {
            setError(undefined);
            if (!screenState.type) {
                if (pass.length === 4) {
                    const stored = Settings.getPasscode();
                    if (stored === pass) {
                        if (props.onSuccess) props.onSuccess();
                    } else {
                        setScreenState({});
                        setError(t('security.error'));
                    }
                } else {
                    setScreenState({
                        pass: {
                            value: pass
                        }
                    })
                }
            } else {
                if (screenState.type === 'new') {
                    if (pass.length === 4) {
                        setScreenState({
                            pass: {
                                value: pass
                            },
                            type: 'reenter'
                        });
                    } else {
                        setScreenState(prev => {
                            return {
                                ...prev,
                                pass: {
                                    value: pass
                                },
                            }
                        });
                    }
                } else {
                    if (pass.length === 4) {
                        if (pass === screenState.pass?.value) {
                            Settings.setPasscode(pass);
                            if (props.onSuccess) props.onSuccess();
                        } else {
                            setScreenState(prev => {
                                return {
                                    pass: {
                                        value: prev.pass?.value
                                    },
                                    type: 'reenter'
                                }
                            });
                            setError(t('security.error'));
                        }
                    } else {
                        setScreenState(prev => {
                            return {
                                ...prev,
                                pass: {
                                    value: prev.pass?.value,
                                    confirmValue: pass
                                },
                            }
                        });
                    }
                }
            }
        },
        [screenState, setScreenState, props],
    );

    console.log({ screenState });

    return (
        <View style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0, left: 0,
            backgroundColor: Theme.background,
            alignItems: 'center'
        }}>
            <View style={{ flexGrow: 1 }} />
            <Text style={{
                color: error
                    ? Theme.warningText
                    : Theme.textColor
            }}>
                {
                    !!error
                        ? error
                        : screenState.type === 'reenter'
                            ? t('security.reenter')
                            : screenState.type === 'new'
                                ? t('security.new')
                                : t('security.confirm')
                }
            </Text>
            <PasscodeInput
                error={error}
                title={screenState.type === 'reenter'
                    ? t('security.reenter')
                    : screenState.type === 'new'
                        ? t('security.new')
                        : t('security.confirm')}
                value={
                    screenState.type === 'reenter'
                        ? screenState.pass?.confirmValue
                        : screenState.pass?.value
                }
                onChange={onChange}
            />
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});
