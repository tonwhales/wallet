import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEngine } from '../../engine/Engine';
import { ZenPayAppComponent } from './components/ZenPayAppComponent';
import { Theme } from '../../Theme';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { zenPayUrl } from '../../engine/corp/ZenPayProduct';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export type ZenPayAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const ZenPayAppFragment = fragment(() => {
    const engine = useEngine();
    const params = useParams<ZenPayAppParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const status = engine.products.zenPay.useStatus();
    const endpoint = useMemo(() => {
        let url = zenPayUrl;
        if (params.type === 'account') {
            url += status.state === 'ready' ? '/create/about' : '';
        } else if (params.type === 'card') {
            url += `/card/${params.id}`;
        }
        return url
    }, [params, status]);

    const needsEnrolment = useMemo(() => {
        try {
            let domain = extractDomain(zenPayUrl);
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

    React.useEffect(() => {
        if (needsEnrolment) {
            navigation.goBack();
        }
    }, [needsEnrolment]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.background
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

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
        </View>
    );
});