import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useHoldersStatus } from '../../engine/hooks/useHoldersStatus';
import { holdersUrl } from '../../engine/legacy/holders/HoldersProduct';

export type HoldersAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const HoldersAppFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const params = useParams<HoldersAppParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const status = useHoldersStatus();

    const needsEnrollment = useMemo(() => {
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            // let domainKey = getDomainKey(domain);
            // if (!domainKey) {
            //     return true;
            // }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    React.useEffect(() => {
        if (needsEnrollment) {
            navigation.goBack();
        }
    }, [needsEnrollment]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.item
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