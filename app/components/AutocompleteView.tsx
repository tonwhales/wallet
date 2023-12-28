import * as React from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemeType } from '../engine/state/theme';
import { useTheme } from '../engine/hooks';

const height = 50;

function WordComponent(props: {
    text: string | null,
    highlight?: boolean,
    onSelected: (value: string) => void
    theme: ThemeType
}) {
    return (
        <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignSelf: 'stretch' }}>
            <TouchableOpacity
                activeOpacity={0.6}
                onPress={props.text ? () => props.onSelected(props.text!) : undefined}
                disabled={!props.text}
                style={{ flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', flexGrow: 1, height: height }}
            >
                <View style={{
                    alignSelf: 'stretch',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginVertical: 6,
                    marginHorizontal: 6,
                    borderRadius: 8,
                    flexGrow: 1,
                    flexBasis: 0,
                    backgroundColor: props.text && props.highlight ? props.theme.divider : undefined
                }}>
                    <Text style={{ fontSize: 16, color: props.theme.textPrimary }}>
                        {props.text}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export const AutocompleteView = React.memo((props: {
    suggestions: string[],
    onSelected: (value: string) => void
}) => {
    const theme = useTheme();

    if (!props.suggestions || props.suggestions.length === 0) {
        return null;
    }

    let word0: string | null = null;
    let word1: string | null = null;
    let word2: string | null = null;
    if (props.suggestions.length === 1) {
        word1 = props.suggestions[0];
    }
    if (props.suggestions.length === 2) {
        word1 = props.suggestions[0];
        word0 = props.suggestions[1];
    }
    if (props.suggestions.length > 2) {
        word1 = props.suggestions[0];
        word0 = props.suggestions[1];
        word2 = props.suggestions[2];
    }

    return (
        <View
            style={{
                height: height,
                backgroundColor: theme.surfaceOnBg,
                flexDirection: 'row',
                alignSelf: 'stretch',
                alignItems: 'stretch',
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.23,
                shadowRadius: 2.62,

                elevation: 4,
                // paddingVertical: 4,
            }}
        >
            <WordComponent theme={theme} text={word0} onSelected={props.onSelected} />
            <View style={{ width: 1, backgroundColor: theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <WordComponent theme={theme} text={word1} onSelected={props.onSelected} highlight={true} />
            <View style={{ width: 1, backgroundColor: theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <WordComponent theme={theme} text={word2} onSelected={props.onSelected} />
        </View>
    );
});