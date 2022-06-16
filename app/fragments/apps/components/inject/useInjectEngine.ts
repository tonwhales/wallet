import * as React from 'react';
import * as t from 'io-ts';
import { InjectEngine } from './injectEngine';
import { AppConfig } from '../../../../AppConfig';
import * as c from '../../../../engine/utils/codecs';
import { useTypedNavigation } from '../../../../utils/useTypedNavigation';
import { Cell } from 'ton';

const transCodec = t.type({
    network: t.union([t.literal('sandbox'), t.literal('mainnet')]),
    to: c.address,
    value: c.bignum,
    timeout: t.number,
    stateInit: t.union([c.cell, t.null]),
    text: t.union([t.string, t.null]),
    payload: t.union([c.cell, t.null])
});

const transactionResponse = t.type({
    result: t.union([t.literal('sent'), t.literal('rejected')])
});

export function useInjectEngine() {
    const navigation = useTypedNavigation();
    return React.useMemo(() => {
        const inj = new InjectEngine();
        inj.registerMethod('tx', transCodec, transactionResponse, async (src) => {

            // Check network
            if (AppConfig.isTestnet && src.network !== 'sandbox') {
                throw Error('Invalid network');
            }
            if (!AppConfig.isTestnet && src.network !== 'mainnet') {
                throw Error('Invalid network');
            }

            // Callback
            let callback: (ok: boolean, res: Cell | null) => void;
            let future = new Promise<{ result: 'sent' | 'rejected' }>((resolve) => {
                callback = (ok, res) => {
                    if (ok) {
                        resolve({ result: 'sent' });
                    } else {
                        resolve({ result: 'rejected' });
                    }
                };
            });

            // Navigation
            if (src.payload) {
                navigation.navigateTransfer({
                    order: {
                        target: src.to.toFriendly({ testOnly: AppConfig.isTestnet }),
                        amount: src.value,
                        amountAll: false,
                        payload: src.payload,
                        stateInit: src.stateInit,
                    },
                    text: src.text,
                    job: null,
                    callback: callback!
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: src.to.toFriendly({ testOnly: AppConfig.isTestnet }),
                    amount: src.value,
                    stateInit: src.stateInit,
                    comment: src.text,
                    job: null,
                    jetton: null,
                    callback: callback!
                });
            }

            return await future;
        });
        return inj;
    }, []);
}