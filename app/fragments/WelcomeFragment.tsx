import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '../components/AppLogo';
import { RoundButton } from '../components/RoundButton';
import { fragment } from "../fragment";
import { useTypedNavigation } from '../utils/useTypedNavigation';

export const WelcomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#F7F7F7' }}>
            <View style={{ height: 64, marginTop: safeArea.bottom }} />
            <View style={{ flexGrow: 1 }} />
            <AppLogo />
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 64, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Create wallet" onPress={() => navigation.navigate('WalletImport')} />
            </View>
        </View>
    );
});