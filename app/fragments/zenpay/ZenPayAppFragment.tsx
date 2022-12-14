import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEngine } from '../../engine/Engine';
import { ZenPayAppComponent } from './ZenPayAppComponent';
import { Theme } from '../../Theme';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { ZenPayEnrollmentComponent } from './ZenPayEnrollmentComponent';
import { useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { ZenPayInfoComponent } from './ZenPayInfoComponent';

export type ZenPayAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const ZenPayAppFragment = fragment(() => {
    const engine = useEngine();
    const params = useParams<ZenPayAppParams>();
    const safeArea = useSafeAreaInsets();
    const status = engine.products.zenPay.useStatus();
    const endpoint = useMemo(() => {
        return 'https://next.zenpay.org' + (
            params.type === 'account'
                ? status.state === 'ready'
                    ? '/create'
                    : ''
                : `/card/${params.id}`
        );
    }, [params, status]);

    const [showInfo, setShowInfo] = React.useState(endpoint.includes('/create') || status.state === 'need-kyc' || status.state === 'need-phone' ? true : false);

    const needsEnrolment = useMemo(() => {
        try {
            let domain = extractDomain('https://next.zenpay.org');
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.persistence.domainKeys.getValue(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.background
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

            {!needsEnrolment && !showInfo && (
                <ZenPayAppComponent
                    title={t('products.zenPay.title')}
                    variant={params}
                    token={(
                        status as { state: 'need-phone', token: string }
                        | { state: 'need-kyc', token: string }
                        | { state: 'ready', token: string }
                    ).token}
                    endpoint={endpoint}
                />
            )}

            {needsEnrolment && (
                <ZenPayEnrollmentComponent engine={engine} endpoint={endpoint} />
            )}

            {showInfo && !needsEnrolment && (
                <ZenPayInfoComponent callback={() => { setShowInfo(false) }} />
            )}
        </View>
    );
});