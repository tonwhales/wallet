import { useKeyboard } from '@react-native-community/hooks';
import * as React from 'react'
import {
    Platform,
    Pressable,
    Text,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wordlist } from 'ton-crypto/dist/mnemonic/wordlist';
import { Theme } from '../../Theme';
import { useFocusedInput } from './hooks/useFocusedInput';


export const AndroidInputAccessoryView = React.memo(() => {
    if (Platform.OS !== 'android') return null;
    const { keyboardShown, keyboardHeight } = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const { current } = useFocusedInput();

    if (!current || !keyboardShown || !current.value) return null;

    const suggestions = (current?.value && current.value.length > 0)
        ? wordlist.filter((w) => w.startsWith(current.value!))
        : [];

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
            {suggestions.length >= 2 && (
                <Pressable
                    key={suggestions[1]}
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
                        current?.onSetValue(suggestions[1]);
                    }}
                >
                    <Text style={{
                        fontSize: 22
                    }}>
                        {suggestions[1]}
                    </Text>
                </Pressable>
            )}
            {suggestions.length >= 1 && (
                <View style={{ flexDirection: 'row' }}>
                    {suggestions.length >= 2 && (<View style={{ width: 1, backgroundColor: Theme.divider }} />)}
                    <Pressable
                        key={suggestions[0]}
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
                            current?.onSetValue(suggestions[0]);
                        }}
                    >
                        <Text style={{
                            fontSize: 22
                        }}>
                            {suggestions[0]}
                        </Text>
                    </Pressable>
                    {suggestions.length >= 3 && (<View style={{ width: 1, backgroundColor: Theme.divider }} />)}
                </View>
            )}
            {suggestions.length >= 3 && (
                <Pressable
                    key={suggestions[2]}
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
                        current?.onSetValue(suggestions[2]);
                    }}
                >
                    <Text style={{
                        fontSize: 22
                    }}>
                        {suggestions[2]}
                    </Text>
                </Pressable>
            )}
        </View>
    )
}
)