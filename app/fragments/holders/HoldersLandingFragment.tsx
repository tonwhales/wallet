import * as React from 'react';
import { View } from 'react-native';
import { useParams } from '../../utils/useParams';
import { HoldersAppParams } from './HoldersAppFragment';
import { fragment } from '../../fragment';
import { useIsLedgerRoute, useTheme } from '../../engine/hooks';
import { StatusBar } from 'expo-status-bar';
import { HoldersLandingComponent } from './components/HoldersLandingComponent';

export const HoldersLandingFragment = fragment(() => {
    const theme = useTheme();
    const isLedger = useIsLedgerRoute()

    const { endpoint, onEnrollType, inviteId, invitationId } = useParams<{ endpoint: string, onEnrollType: HoldersAppParams, inviteId?: string, invitationId?: string }>();

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundPrimary }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <HoldersLandingComponent
                endpoint={endpoint}
                onEnrollType={onEnrollType}
                inviteId={inviteId}
                invitationId={invitationId}
                isLedger={isLedger}
            />
        </View>
    );
});