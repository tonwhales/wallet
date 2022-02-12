import { useKeyboard } from '@react-native-community/hooks';
import * as React from 'react'
import {
    Platform,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wordlist } from 'ton-crypto/dist/mnemonic/wordlist';
import { Theme } from '../../Theme';
import { WordsListTrie } from '../../utils/wordsListTrie';
import { useFocusedInput } from './hooks/useFocusedInput';

const wordsTrie = WordsListTrie();

export const AndroidInputAccessoryView = React.memo(() => {
    if (Platform.OS !== 'android') return null;
    const { keyboardShown, keyboardHeight } = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const { current } = useFocusedInput();
    const { width } = useWindowDimensions();

    const suggestions = React.useMemo(() => {
        const res = (current?.value && current.value.length > 0)
            ? wordsTrie.find(current.value)
            : [];
        return res;
    }, [current?.value]);

    if (!current || !keyboardShown || !current.value) return null;

    return (
        <View
            style={{
                height: 50,
                backgroundColor: 'white',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                position: 'absolute',
                bottom: safeArea.bottom + 28,
                left: 0, right: 0
            }}
        >
            {suggestions && suggestions.length > 0 &&
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
                        {suggestions.length > 1 &&
                            suggestions.map((item, index) => {
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
                                            onPress={() => { current.onSetValue(item); }}
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
                        {suggestions.length === 1 && (
                            <>
                                <View
                                    key={'filler-0'}
                                    style={{ width: (width - 20) / 3 }}
                                />
                                <View style={{ width: 1, backgroundColor: Theme.divider, marginHorizontal: 4 }} />
                                <Pressable
                                    key={suggestions[0]}
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
                                    onPress={() => { current.onSetValue(suggestions![0]); }}
                                >
                                    <Text style={{
                                        fontSize: 16
                                    }}>
                                        {suggestions[0]}
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
        </View>
    )
}
)