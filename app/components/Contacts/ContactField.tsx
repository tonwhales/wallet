import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { ATextInput, ATextInputRef } from "../ATextInput";
import { useAppConfig } from "../../utils/AppConfigContext";

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
    const { Theme } = useAppConfig();
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
        <View style={{
            backgroundColor: Theme.lightGrey,
            paddingHorizontal: 20, marginTop: 20,
            paddingVertical: 10,
            width: '100%', borderRadius: 20
        }}>
            <TextInput
                style={[
                    {
                        textAlignVertical: 'top',
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400', color: Theme.textColor
                    }
                ]}
                maxLength={126}
                placeholder={label}
                placeholderTextColor={Theme.placeholder}
                multiline={false}
                blurOnSubmit={true}
                editable={props.input.editable}
                value={value}
                onFocus={() => {
                    if (props.input.onFocus) {
                        props.input.onFocus(props.index);
                    }
                }}
                onChangeText={(newValue) => {
                    setValue(newValue);
                    props.onFieldChange(props.index - 1, newValue);
                }}
                onSubmitEditing={() => {
                    if (props.input.onSubmit) {
                        props.input.onSubmit(props.index);
                    }
                }}
            />
        </View>
    )

});