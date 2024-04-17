import * as React from 'react';
import { fragment } from '../../fragment';
import { View } from 'react-native';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect } from 'react';
import { useHoldersAccountStatus, useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { holdersUrl } from '../../engine/api/holders/fetchAccountState';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { onHoldersInvalidate } from '../../engine/effects/onHoldersInvalidate';
import { useFocusEffect } from '@react-navigation/native';

export type HoldersAppParams = { type: 'account'; id: string; } | { type: 'create' } | { type: 'prepaid'; id: string};

export const HoldersAppFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const params = useParams<HoldersAppParams>();
    const selected = useSelectedAccount();
    const status = useHoldersAccountStatus(selected!.address).data;

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
            <HoldersAppComponent
                title={t('products.holders.title')}
                variant={params}
                token={(status as { token: string }).token}
                endpoint={holdersUrl}
            />
        </View>
    );
});