import * as React from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Theme } from '../Theme';
import { AndroidToolbar } from './AndroidToolbar';

export function Page(props: { children?: any, style?: StyleProp<ViewStyle> }) {
    return (
        <>
            {Platform.OS === 'android' && (
                <View style={{ paddingTop: 38 }}>
                    <AndroidToolbar />
                </View>
            )}
            <ScrollView style={{ flexGrow: 1, flexBasis: 0, backgroundColor: Theme.background }} contentContainerStyle={props.style}>
                {props.children}
            </ScrollView>
        </>
    );
}