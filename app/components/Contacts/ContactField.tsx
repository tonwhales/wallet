import React, { forwardRef, memo, useEffect, useState } from "react";
import { TextInput } from "react-native";
import { t } from "../../i18n/t";
import { ATextInput } from "../ATextInput";
import { useTheme } from '../../engine/hooks';
import { useContactField } from '../../engine/hooks';

function useDebounceInput(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

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
    onFieldChange?: (index: number, value: string) => void,
}, ref: React.ForwardedRef<TextInput>) => {
    const theme = useTheme();
    const [value, setValue] = useState(props.input.value || '');
    const debouncedValue = useDebounceInput(value, 500);

    useEffect(() => {
        if (props.onFieldChange) {
            props.onFieldChange(props.index, debouncedValue);
        }
    }, [debouncedValue]);

    let label = useContactField(props.fieldKey);

    if (props.fieldKey === 'lastName') {
        label = t('contacts.lastName');
    }

    if (props.fieldKey === 'notes') {
        label = t('contacts.notes');
    }

    return (
        <ATextInput
            ref={ref}
            inputStyle={{
                fontSize: 17,
                fontWeight: '400', color: theme.textPrimary
            }}
            style={{ paddingHorizontal: 16 }}
            maxLength={126}
            label={label}
            multiline={false}
            blurOnSubmit={true}
            editable={props.input.editable}
            value={value}
            onFocus={() => {
                if (props.input.onFocus) {
                    props.input.onFocus(props.index);
                }
            }}
            onBlur={() => {
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
            cursorColor={theme.accent}
        />
    )

}));