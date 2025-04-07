import * as React from 'react';
import { View } from 'react-native';
import { useParams } from '../../utils/useParams';
import { HoldersAppParams } from './HoldersAppFragment';
import { fragment } from '../../fragment';
import { useTheme } from '../../engine/hooks';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
import { HoldersLandingComponent } from './components/HoldersLandingComponent';

export const HoldersLandingFragment = fragment(() => {
    const theme = useTheme();
    const route = useRoute();
    const isLedger = route.name === 'LedgerHoldersLanding';

    const { endpoint, onEnrollType, inviteId } = useParams<{ endpoint: string, onEnrollType: HoldersAppParams, inviteId?: string }>();

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundPrimary }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <HoldersLandingComponent
                endpoint={endpoint}
                onEnrollType={onEnrollType}
                inviteId={inviteId}
                isLedger={isLedger}
            />
        </View>
    );
});