import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect, useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useHoldersStatus } from '../../engine/hooks/useHoldersStatus';
import { useTheme } from '../../engine/hooks/useTheme';
import { useDomainKey } from '../../engine/hooks/dapps/useDomainKey';
import { holdersUrl } from '../../engine/api/holders/fetchAccountState';

export type HoldersAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const HoldersAppFragment = fragment(() => {
    const theme = useTheme();
    const params = useParams<HoldersAppParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const status = useHoldersStatus();
    const domain = extractDomain(holdersUrl);
    const domainKey = useDomainKey(domain);

    const needsEnrollment = useMemo(() => {
        try {
            if (!domain) {
                return; // Shouldn't happen
            }
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrollment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status, domainKey]);

    useEffect(() => {
        if (needsEnrollment) {
            navigation.goBack();
        }
    }, [needsEnrollment]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: theme.item
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

            <HoldersAppComponent
                title={t('products.zenPay.title')}
                variant={params}
                token={(
                    status as { state: 'need-phone', token: string }
                    | { state: 'need-kyc', token: string }
                    | { state: 'ready', token: string }
                ).token}
                endpoint={holdersUrl}
            />
        </View>
    );
});