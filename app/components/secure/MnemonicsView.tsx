import React, { memo, useEffect, useState } from "react";
import { View, Text, TextStyle, ViewStyle, StyleProp, Platform } from "react-native"
import { useTheme } from "../../engine/hooks";
import * as ScreenCapture from 'expo-screen-capture';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const wordStyle: TextStyle = {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24
}

const MnemonicWord = memo(({ word, index }: { word: string, index: number }) => {
    const theme = useTheme();

    return (
        <View style={{ flexDirection: 'row', marginBottom: (index !== 11 && index !== 23) ? 8 : 0 }}>
            <Text style={[
                wordStyle,
                {
                    opacity: 0.5,
                    paddingRight: 8,
                    textAlign: 'right',
                    minWidth: 24,
                    color: theme.textPrimary,
                }]}>
                {index + 1}
            </Text>
            <Text style={[wordStyle, { color: theme.textPrimary }]}>
                {word}
            </Text>
        </View>
    );
})

export const MnemonicsView = memo(({ mnemonics, style, preventCapture }: { mnemonics: string, style?: StyleProp<ViewStyle>, preventCapture?: boolean }) => {
    const theme = useTheme();
    const words = mnemonics.split(' ');
    const wordsCol1 = words.slice(0, 12);
    const wordsCol2 = words.slice(12, 24);

    useEffect(() => {
        // Keeping screen in awakened state
        activateKeepAwakeAsync('MnemonicsView');
        return () => {
            deactivateKeepAwake('MnemonicsView');
        }
    }, []);

    return (
        <View style={[
            {
                padding: 20,
                borderRadius: 20,
                backgroundColor: theme.border,
                flexDirection: 'row',
                justifyContent: 'space-evenly',
            },
            style
        ]}>
            <View style={{ alignItems: 'flex-start', flexGrow: 1, }}>
                {wordsCol1.map((word, index) => {
                    return (<MnemonicWord key={index} word={word} index={index} />);
                })}
            </View>
            <View style={{ alignItems: 'flex-start', flexGrow: 1, }}>
                {wordsCol2.map((word, index) => {
                    return (<MnemonicWord key={index + 10} word={word} index={index + 12} />);
                })}
            </View>
        </View>
    );
});