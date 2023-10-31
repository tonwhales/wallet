import * as React from 'react';
import { Alert } from 'react-native';
import { t } from './i18n/t';
import { useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';

export function useLinkNavigator(isTestnet: boolean) {
    const navigation = useTypedNavigation();

    const handler = React.useCallback((resolved: ResolvedUrl) => {
        if (resolved.type === 'transaction') {
            if (resolved.payload) {
                navigation.navigateTransfer({
                    order: {
                        messages: [{
                            target: resolved.address.toString({ testOnly: isTestnet }),
                            amount: resolved.amount || BigInt(0),
                            amountAll: false,
                            stateInit: resolved.stateInit,
                            payload: resolved.payload,
                        }]
                    },
                    text: resolved.comment,
                    job: null,
                    callback: null
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: resolved.address.toString({ testOnly: isTestnet }),
                    comment: resolved.comment,
                    amount: resolved.amount,
                    stateInit: resolved.stateInit,
                    job: null,
                    jetton: null,
                    callback: null
                });
            }
        }
        if (resolved.type === 'jetton-transaction') {
            // TODO:
            // const jettons = engine.products.main.getJettons().jettons;
            // const jetton = jettons.find((j) => {
            //     return j.master.equals(resolved.jettonMaster);
            // });
            const jetton: any = null;

            // TODO: try fetching jetton master on SimpleTransferFragment
            if (!jetton) {
                Alert.alert(t('transfer.wrongJettonTitle'), t('transfer.wrongJettonMessage'));
                return;
            }

            navigation.navigateSimpleTransfer({
                target: resolved.address.toString({ testOnly: isTestnet }),
                comment: resolved.comment,
                amount: resolved.amount,
                stateInit: null,
                job: null,
                jetton: jetton.wallet,
                callback: null
            });
        }
        if (resolved.type === 'connect') {
            navigation.navigate('Authenticate', {
                session: resolved.session,
                endpoint: resolved.endpoint
            });
        }
        if (resolved.type === 'tonconnect') {
            navigation.navigate('TonConnectAuthenticate', { query: resolved.query, type: 'qr' });
        }
        if (resolved.type === 'install') {
            navigation.navigate('Install', {
                url: resolved.url,
                title: resolved.customTitle,
                image: resolved.customImage
            });
        }
    }, []);

    return handler;
}
