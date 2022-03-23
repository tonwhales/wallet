import React, { useCallback } from "react"
import { Pressable, View, Text, PressableStateCallbackType, StyleProp, ViewStyle, TextStyle } from "react-native"
import { Theme } from "../../Theme";

function inputButtonStyle(state: PressableStateCallbackType): StyleProp<ViewStyle> {
    return ({
        backgroundColor: Theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        height: 84, width: 84,
        borderRadius: 84,
        margin: 8,
        opacity: state.pressed ? 0.8 : 1
    })
}

const keyHintStyle: StyleProp<TextStyle> = {
    fontSize: 24,
    fontWeight: '700'
}

export const PasscodeInput = React.memo((
    {
        value,
        onChange,
        error,
        title
    }: {
        value?: string,
        onChange?: (newVal: string) => void,
        error?: string,
        title?: string
    }
) => {
    const onKeyPressed = useCallback(
        (key: string) => {
            console.log({ key, value });
            if (onChange) {
                console.log({ key, value });
                onChange(value ? value + key : key)
            }
        },
        [value, onChange],
    );


    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* 1, 2, 3 */}
            <View style={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Text style={{
                    color: error
                        ? Theme.warningText
                        : Theme.textColor,
                    fontWeight: '600',
                    fontSize: 24,
                    textAlign: 'center'
                }}>
                    {error || title}
                </Text>
            </View>
            <View style={{ width: '100%' }}>
                <Text>
                    {value}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', width: '100%' }}>
                <Pressable
                    onPress={() => onKeyPressed('1')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'1'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onKeyPressed('2')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'2'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onKeyPressed('3')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'3'}
                    </Text>
                </Pressable>
            </View>
            {/* 4, 5, 6 */}
            <View style={{ flexDirection: 'row', width: '100%' }}>
                <Pressable
                    onPress={() => onKeyPressed('4')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'4'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onKeyPressed('5')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'5'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onKeyPressed('6')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'6'}
                    </Text>
                </Pressable>
            </View>
            {/* 7, 8, 9 */}
            <View style={{ flexDirection: 'row', width: '100%' }}>
                <Pressable
                    onPress={() => onKeyPressed('7')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'7'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onKeyPressed('8')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'8'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onKeyPressed('9')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'9'}
                    </Text>
                </Pressable>
            </View>
            {/* 0, <- */}
            <View style={{ width: '100%', flexDirection: 'row' }}>
                <View style={{
                    height: 84, width: 84,
                    borderRadius: 84, margin: 8,
                }} />
                <Pressable
                    onPress={() => onKeyPressed('0')}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'0'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => {
                        if (onChange && value) {
                            onChange(value.substring(0, value.length - 2))
                        }
                    }}
                    style={inputButtonStyle}
                >
                    <Text style={keyHintStyle}>
                        {'<-'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
})