import React, { useState } from "react";
import { View, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { ATextInput, ATextInputRef } from "../ATextInput";

export const ContactField = React.memo((props: {
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
    refs: React.RefObject<ATextInputRef>[],
    onFieldChange: (index: number, value: string) => void,
}) => {
    const engine = useEngine();
    const [value, setValue] = useState(props.input.value || '');
    let label = engine.products.settings.useContactField(props.fieldKey);

    if (props.fieldKey === 'lastName') {
        label = t('contacts.lastName');
    }

    if (props.fieldKey === 'notes') {
        label = t('contacts.notes');
    }

    return (
        <>
            <ATextInput
                key={`input-${props.index}`}
                index={props.index}
                ref={props.refs[props.index]}
                onFocus={props.input.onFocus}
                onSubmit={props.input.onSubmit}
                blurOnSubmit={false}
                returnKeyType={props.refs.length - 1 === props.index ? 'done' : 'next'}
                value={value}
                onValueChange={(newValue: string) => {
                    setValue(newValue);
                    props.onFieldChange(props.index - 1, newValue);
                }}
                placeholder={label}
                keyboardType={'default'}
                preventDefaultHeight
                editable={props.input.editable}
                enabled={props.input.enabled}
                label={
                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                    }}>
                        <Text style={{
                            fontWeight: '500',
                            fontSize: 12,
                            color: Theme.label,
                            alignSelf: 'flex-start',
                        }}>
                            {label}
                        </Text>
                    </View>
                }
                multiline
                autoCorrect={false}
                autoComplete={'off'}
                style={{
                    backgroundColor: Theme.transparent,
                    paddingHorizontal: 0,
                    marginHorizontal: 16,
                }}
            />
            {(props.index + 1 < props.refs.length) && (
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
            )}
        </>
    )

});