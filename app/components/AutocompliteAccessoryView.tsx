import React from "react";
import { InputAccessoryView, Pressable, View, Text, Platform, FlatList, useWindowDimensions } from "react-native";
import { wordlist } from "ton-crypto/dist/mnemonic/wordlist";
import { Theme } from "../Theme";

export const AutocompliteAccessoryView = React.memo((props: {
    suggestions?: string[],
    setValue: (newValue: string) => void
    inputAccessoryViewID: string
}) => {
    const { width } = useWindowDimensions();

    if (Platform.OS === 'ios') {
        return (
            <InputAccessoryView nativeID={props.inputAccessoryViewID}>
                {props.suggestions && props.suggestions.length > 0 &&
                    (
                        <View
                            style={{
                                height: 50,
                                backgroundColor: 'white',
                                flexDirection: 'row',
                                flexGrow: 1,
                                paddingVertical: 4
                            }}
                        >
                            {props.suggestions.length > 1 &&
                                props.suggestions.map((item, index) => {
                                    if (index > 2) { return undefined; }
                                    return (
                                        <View
                                            key={`suggestion-${index}`}
                                            style={{
                                                marginLeft: index === 0 ? 5 : 0,
                                                marginRight: index === 2 ? 5 : 0,
                                                flexDirection: 'row'
                                            }}
                                        >
                                            <Pressable
                                                style={({ pressed }) => {
                                                    return {
                                                        width: (width - 20) / 3,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        paddingVertical: 8,
                                                        opacity: pressed ? 0.5 : 1,
                                                        borderRadius: 8,
                                                        backgroundColor: index === 1 ? Theme.divider : undefined
                                                    }
                                                }}
                                                onPress={() => { props.setValue(item); }}
                                            >
                                                <Text style={{
                                                    fontSize: 16
                                                }}>
                                                    {item}
                                                </Text>
                                            </Pressable>
                                            {index < 2 && (<View style={{ width: 1, backgroundColor: Theme.divider, marginHorizontal: 4 }} />)}
                                        </View>
                                    )
                                })
                            }
                            {props.suggestions.length === 1 && (
                                <>
                                    <View
                                        key={'filler-0'}
                                        style={{ width: (width - 20) / 3 }}
                                    />
                                    <View style={{ width: 1, backgroundColor: Theme.divider, marginHorizontal: 4 }} />
                                    <Pressable
                                        key={props.suggestions[0]}
                                        style={({ pressed }) => {
                                            return {
                                                width: (width - 20) / 3,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: Theme.divider,
                                                paddingVertical: 8,
                                                opacity: pressed ? 0.5 : 1,
                                                marginHorizontal: 5,
                                                borderRadius: 8
                                            }
                                        }}
                                        onPress={() => { props.setValue(props.suggestions![0]); }}
                                    >
                                        <Text style={{
                                            fontSize: 16
                                        }}>
                                            {props.suggestions[0]}
                                        </Text>
                                    </Pressable>
                                    <View style={{ width: 1, backgroundColor: Theme.divider, marginHorizontal: 4 }} />
                                    <View
                                        key={'filler-1'}
                                        style={{ width: (width - 20) / 3 }}
                                    />
                                </>
                            )}
                        </View>
                    )
                }
            </InputAccessoryView>
        );
    }

    return null;
});