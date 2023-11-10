import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useHoldersAccountStatus, useSelectedAccount, useTheme } from '../../engine/hooks';
import { useDomainKey } from '../../engine/hooks';
import { HoldersAccountState, holdersUrl } from '../../engine/api/holders/fetchAccountState';

export type HoldersAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const HoldersAppFragment = fragment(() => {
    const theme = useTheme();
    const params = useParams<HoldersAppParams>();
    const safeArea = useSafeAreaInsets();
    const selected = useSelectedAccount();
    const navigation = useTypedNavigation();
    const status = useHoldersAccountStatus(selected!.address).data;
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
    }, [status, domainKey]);

    useEffect(() => {
        if (needsEnrollment) {
            navigation.goBack();
        }
    }, [needsEnrollment]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    return (
        <View style={{
            flex: 1,
            paddingTop: safeArea.top,
            backgroundColor: theme.surfacePimary
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

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