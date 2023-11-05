import React, { memo } from "react";
import { View, Text, TextStyle, ViewStyle, StyleProp } from "react-native"
import { useTheme } from "../../engine/hooks";

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

export const MnemonicsView = memo(({ mnemonics, style }: { mnemonics: string, style?: StyleProp<ViewStyle> }) => {
    const theme = useTheme();
    const words = mnemonics.split(' ');
    const wordsCol1 = words.slice(0, 12);
    const wordsCol2 = words.slice(12, 24);

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