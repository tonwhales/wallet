import * as React from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Theme } from '../Theme';

const height = 50;

function WordComponent(props: { text: string | null, highlight?: boolean, onSelected: (value: string) => void }) {
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
                    backgroundColor: props.text && props.highlight ? Theme.divider : undefined
                    // backgroundColor: 'red'
                }}>
                    <Text style={{ fontSize: 16 }}>
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
                backgroundColor: 'white',
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
            <WordComponent text={word0} onSelected={props.onSelected} />
            <View style={{ width: 1, backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <WordComponent text={word1} onSelected={props.onSelected} highlight={true} />
            <View style={{ width: 1, backgroundColor: Theme.divider, marginHorizontal: 4, marginVertical: 8 }} />
            <WordComponent text={word2} onSelected={props.onSelected} />
        </View>
    );
});