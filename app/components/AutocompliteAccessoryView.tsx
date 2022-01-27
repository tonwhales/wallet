import React from "react";
import { InputAccessoryView, Pressable, View, Text, Platform } from "react-native";
import { wordlist } from "ton-crypto/dist/mnemonic/wordlist";
import { Theme } from "../Theme";

export const AutocompliteAccessoryView = React.memo((props: {
    suggestions?: string[],
    setValue: (newValue: string) => void
    inputAccessoryViewID: string
}) => {

    if (Platform.OS === 'ios') {
        return (
            <InputAccessoryView nativeID={props.inputAccessoryViewID}>
                <View
                    style={{
                        height: 50,
                        backgroundColor: 'white',
                        flexDirection: 'row',
                        justifyContent: 'space-evenly',
                        alignItems: 'center'
                    }}
                >
                    {props.suggestions && props.suggestions.length >= 2 && (
                        <Pressable
                            key={props.suggestions[1]}
                            style={({ pressed }) => {
                                return {
                                    marginRight: 2,
                                    borderRadius: 16,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => {
                                props.setValue(props.suggestions![1]);
                            }}
                        >
                            <Text style={{
                                fontSize: 16
                            }}>
                                {props.suggestions[1]}
                            </Text>
                        </Pressable>
                    )}
                    {props.suggestions && props.suggestions.length >= 1 && (
                        <View style={{ flexDirection: 'row' }}>
                            {props.suggestions.length >= 2 && (<View style={{ width: 1, backgroundColor: Theme.divider }} />)}
                            <Pressable
                                key={props.suggestions[0]}
                                style={({ pressed }) => {
                                    return {
                                        marginRight: 2,
                                        borderRadius: 16,
                                        paddingHorizontal: 24,
                                        paddingVertical: 8,
                                        opacity: pressed ? 0.5 : 1
                                    }
                                }}
                                onPress={() => {
                                    props.setValue(props.suggestions![0]);
                                }}
                            >
                                <Text style={{
                                    fontSize: 16
                                }}>
                                    {props.suggestions[0]}
                                </Text>
                            </Pressable>
                            {props.suggestions.length >= 3 && (<View style={{ width: 1, backgroundColor: Theme.divider }} />)}
                        </View>
                    )}
                    {props.suggestions && props.suggestions.length >= 3 && (
                        <Pressable
                            key={props.suggestions[2]}
                            style={({ pressed }) => {
                                return {
                                    marginRight: 2,
                                    borderRadius: 16,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => {
                                props.setValue(props.suggestions![2]);
                            }}
                        >
                            <Text style={{
                                fontSize: 16
                            }}>
                                {props.suggestions[2]}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </InputAccessoryView>
        );
    }

    return null;
});