import * as React from 'react';
import { fragment } from '../../fragment';
import { View } from 'react-native';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect, useMemo } from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useAppConnections, useConnectApp, useHoldersAccountStatus, useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { HoldersAccountState, holdersUrl } from '../../engine/api/holders/fetchAccountState';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { onHoldersInvalidate } from '../../engine/effects/onHoldersInvalidate';
import { useFocusEffect } from '@react-navigation/native';
import { extensionKey } from '../../engine/hooks/dapps/useAddExtension';
import { TonConnectBridgeType } from '../../engine/tonconnect/types';

export type HoldersAppParams = { type: 'account'; id: string; } | { type: 'create' };

export const HoldersAppFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const params = useParams<HoldersAppParams>();
    const selected = useSelectedAccount();
    const navigation = useTypedNavigation();
    const status = useHoldersAccountStatus(selected!.address).data;
    const connectApp = useConnectApp();
    const connectAppConnections = useAppConnections();

    const needsEnrollment = useMemo(() => {
        try {
            const app = connectApp(holdersUrl);

            if (!app) {
                return true;
            }

            const connections = connectAppConnections(extensionKey(app.url));

            if (!connections.find((item) => item.type === TonConnectBridgeType.Injected)) {
                return true;
            }

            if (!status) {
                return true;
            }
            if (status.state === HoldersAccountState.NeedEnrollment) {
                return true;
            }
        } catch (error) {
            return true;
        }

        return false;
    }, [status, connectApp, connectAppConnections]);

    useEffect(() => {
        if (needsEnrollment) {
            navigation.goBack();
        }
    }, [needsEnrollment]);

    useEffect(() => {
        return () => {
            if (!!selected) {
                onHoldersInvalidate(selected.addressString, isTestnet);
            }
        }
    }, [selected, isTestnet]);

    // to account for wierd statusbar bug with navigating withing the bottom bar stack
    useFocusEffect(() => setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark'));

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: theme.backgroundPrimary
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            {needsEnrollment ? null : (
                <HoldersAppComponent
                    title={t('products.holders.title')}
                    variant={params}
                    token={(status as { token: string }).token}
                    endpoint={holdersUrl}
                />
            )}
        </View>
    );
});