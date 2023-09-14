import React, { RefObject, forwardRef, memo, useEffect, useState } from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";

import IcClear from '../../../assets/ic-clear.svg';
import { ATextInput } from "../ATextInput";

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
        <ATextInput
            ref={ref}
            inputStyle={{
                fontSize: 17,
                fontWeight: '400', color: Theme.textPrimary
            }}
            style={{ paddingHorizontal: 16 }}
            maxLength={126}
            label={label}
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
            onValueChange={setValue}
            onSubmit={() => {
                if (props.input.onSubmit) {
                    props.input.onSubmit(props.index);
                }
            }}
        />
    );
}));