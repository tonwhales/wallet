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
import { ZenPayEnrolmentComponent } from './ZenPayEnrolmentComponent';

export type ZenPayAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const ZenPayAppFragment = fragment(() => {
    const engine = useEngine();
    const params = useParams<ZenPayAppParams>();
    const safeArea = useSafeAreaInsets();
    const status = engine.products.zenPay.useStatus();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.background
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

            {status.state !== 'need-enrolment' && (
                <ZenPayAppComponent
                    title={t('products.zenPay.title')}
                    variant={params}
                    token={status.token}
                    endpoint={'https://next.zenpay.org'}
                />
            )}
            {status.state === 'need-enrolment' && (
                <ZenPayEnrolmentComponent engine={engine} endpoint={'https://next.zenpay.org'} />
            )}
        </View>
    );
});