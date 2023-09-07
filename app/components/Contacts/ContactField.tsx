import React, { RefObject, forwardRef, memo, useEffect, useState } from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";

import IcClear from '../../../assets/ic-clear.svg';

export const ContactField = memo(forwardRef((props: {
    input: {
        onFocus?: (index: number) => void,
        onBlur?: (index: number) => void,
        onSubmit?: (index: number) => void,
        value?: string | null,
        editable?: boolean,
        enabled?: boolean,
    },
    fieldKey: string,
    index: number,
    onFieldChange: (index: number, value: string) => void,
}, ref: React.ForwardedRef<TextInput>) => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const [value, setValue] = useState(props.input.value || '');
    const [focused, setFocused] = useState(false);
    let label = engine.products.settings.useContactField(props.fieldKey);

    if (props.fieldKey === 'lastName') {
        label = t('contacts.lastName');
    }

    if (props.fieldKey === 'notes') {
        label = t('contacts.notes');
    }

    useEffect(() => {
        if (props.input.value !== value) {
            setValue(props.input.value || '');
        }
    }, [props.input.value]);

    return (
        <Pressable
            style={{
                backgroundColor: Theme.border,
                width: '100%', borderRadius: 20,
                flexDirection: 'row', alignItems: 'center',
            }}
            onPress={() => {
                (ref as RefObject<TextInput>)?.current?.focus();
            }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
            <View style={{ flexGrow: 1 }}>
                <View style={{
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: 2
                }}>
                    <Text style={{ color: Theme.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                        {label}
                    </Text>
                </View>
                <TextInput
                    ref={ref}
                    style={[
                        {
                            textAlignVertical: 'top',
                            fontSize: 17,
                            fontWeight: '400', color: Theme.textColor
                        }
                    ]}
                    maxLength={126}
                    placeholder={label}
                    placeholderTextColor={Theme.textSecondary}
                    multiline={false}
                    blurOnSubmit={true}
                    editable={props.input.editable}
                    value={value}
                    onFocus={() => {
                        setFocused(true);
                        if (props.input.onFocus) {
                            props.input.onFocus(props.index);
                        }
                    }}
                    onBlur={() => {
                        setFocused(false);
                        if (props.input.onBlur) {
                            props.input.onBlur(props.index);
                        }
                    }}
                    onChangeText={setValue}
                    onSubmitEditing={() => {
                        if (props.input.onSubmit) {
                            props.input.onSubmit(props.index);
                        }
                    }}
                />
            </View>
            {value.length > 0 && focused && (
                <Pressable
                    style={({ pressed }) => {
                        return { opacity: pressed ? 0.5 : 1, height: 24, width: 24, justifyContent: 'center', alignItems: 'center' }
                    }}
                    onPress={() => {
                        setValue('');
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <IcClear
                        height={24} width={24}
                        color={Theme.textSecondary}
                        style={{ height: 24, width: 24, }}
                    />
                </Pressable>
            )}
        </Pressable>
    );
}));