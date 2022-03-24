import React, { useCallback } from "react"
import { Pressable, View, Image, Text, PressableStateCallbackType, StyleProp, ViewStyle, TextStyle } from "react-native"
import { Theme } from "../../Theme";
import { AnimatedCircle } from "./AnimatedCircle";

function inputButtonStyle(state: PressableStateCallbackType): StyleProp<ViewStyle> {
    return ({
        backgroundColor: Theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        height: 84, width: 84,
        borderRadius: 84,
        margin: 8,
        opacity: state.pressed ? 0.3 : 1
    })
}

const keyHintStyle: StyleProp<TextStyle> = {
    fontSize: 24,
    fontWeight: '700',
    color: 'white'
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
            <View style={{
                width: '100%', height: 16,
                flexDirection: 'row', marginTop: 16,
                justifyContent: 'center', alignItems: 'center',
            }}>
                <View style={{
                    height: 12, width: 12,
                    backgroundColor: Theme.divider,
                    borderRadius: 12,
                    margin: 4
                }} />
                <View style={{
                    height: 12, width: 12,
                    backgroundColor: Theme.divider,
                    borderRadius: 12,
                    margin: 4
                }} />
                <View style={{
                    height: 12, width: 12,
                    backgroundColor: Theme.divider,
                    borderRadius: 12,
                    margin: 4
                }} />
                <View style={{
                    height: 12, width: 12,
                    backgroundColor: Theme.divider,
                    borderRadius: 12,
                    margin: 4
                }} />
                {!!value && (
                    <View style={{
                        flexDirection: 'row', position: 'absolute',
                        top: 0, bottom: 0,
                        alignItems: 'center',
                        width: 80,
                    }}>
                        {[...value].map((v, index) => {
                            return (<AnimatedCircle key={`a-c-${index}`} error={!!error} />);
                        })}
                    </View>
                )}
            </View>
            <View style={{ flexDirection: 'row', width: '100%', marginTop: 16 }}>
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
                    <Image style={{ height: 36, width: 36 }} source={require('../../../assets/ic_backspace.png')} />
                </Pressable>
            </View>
        </View>
    );
})