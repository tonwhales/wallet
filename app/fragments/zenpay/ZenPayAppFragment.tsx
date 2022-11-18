import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Color from 'color';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useEngine } from '../../engine/Engine';
import { ZenPayAppComponent } from './ZenPayAppComponent';
import { Theme } from '../../Theme';
import { useParams } from '../../utils/useParams';

export const ZenPayAppFragment = fragment(() => {
    const engine = useEngine();
    const params = useParams<{ cardNumber: string, type: 'card' } | { type: 'account' }>();
    const safeArea = useSafeAreaInsets();
    // const key = engine.products.keys.getDomainKey(domain);
    // if (!appData) {
    //     throw Error('No App Data');
    // }
    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.background
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

            <ZenPayAppComponent variant={params}/>
        </View>
    );
});