import * as React from 'react';
import { fragment } from '../../fragment';
import { View } from 'react-native';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect, useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useHoldersAccountStatus, useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { HoldersAccountState, holdersUrl } from '../../engine/api/holders/fetchAccountState';
import { getDomainKey } from '../../engine/state/domainKeys';
import { StatusBar } from 'expo-status-bar';
import { onHoldersInvalidate } from '../../engine/effects/onHoldersInvalidate';

export type HoldersAppParams = { type: 'account'; id: string; } | { type: 'create' };

export const HoldersAppFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const params = useParams<HoldersAppParams>();
    const selected = useSelectedAccount();
    const navigation = useTypedNavigation();
    const status = useHoldersAccountStatus(selected!.address).data;

    const needsEnrollment = useMemo(() => {
        try {
            const domain = extractDomain(holdersUrl);
            const domainKey = getDomainKey(domain);

            if (!domainKey) {
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
    }, [status]);

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

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundPrimary }}>
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