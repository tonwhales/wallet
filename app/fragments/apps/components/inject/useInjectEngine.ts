import * as React from 'react';
import * as t from 'io-ts';
import { InjectEngine } from './InjectEngine';
import * as c from './../../../../engine/utils/codecs';
import { useTypedNavigation } from '../../../../utils/useTypedNavigation';
import { Cell, Slice } from '@ton/core';

const transCodec = (isTestnet: boolean) => t.type({
    network: t.union([t.literal('testnet'), t.literal('mainnet')]),
    to: c.address(isTestnet),
    value: c.bignum,
    stateInit: t.union([c.cell, t.null, t.undefined]),
    text: t.union([t.string, t.null, t.undefined]),
    payload: t.union([c.cell, t.null, t.undefined])
});

const transactionResponse = t.type({
    state: t.union([t.literal('sent'), t.literal('rejected')]),
    result: t.union([c.cell, t.null])
});

const signCodec = t.type({
    network: t.union([t.literal('testnet'), t.literal('mainnet')]),
    textCell: c.cell,
    payloadCell: c.cell
});

const signResponseCodec = t.type({
    state: t.union([t.literal('sent'), t.literal('rejected')]),
    result: t.union([c.cell, t.null])
});

function parseString(slice: Slice) {
    let res = slice.loadBuffer(Math.floor(slice.remainingBits / 8)).toString();
    let rr = slice;
    if (rr.remainingRefs > 0) {
        rr = rr.loadRef().asSlice();
        res += rr.loadBuffer(Math.floor(rr.remainingBits / 8)).toString();
    }
    return res;
}

export function useInjectEngine(domain: string, name: string, isTestnet: boolean, url: string) {
    const navigation = useTypedNavigation();
    return React.useMemo(() => {
        const inj = new InjectEngine();
        inj.registerMethod('tx', transCodec(isTestnet), transactionResponse, async (src) => {

            // Check network
            if (isTestnet && src.network !== 'testnet') {
                throw Error('Invalid network');
            }
            if (!isTestnet && src.network !== 'mainnet') {
                throw Error('Invalid network');
            }

            // Callback
            let callback: (ok: boolean, res: Cell | null) => void;
            let future = new Promise<{ state: 'sent' | 'rejected', result: Cell | null }>((resolve) => {
                callback = (ok, res) => {
                    resolve({ state: ok ? 'sent' : 'rejected', result: res });
                };
            });

            // Navigation
            if (src.payload) {
                navigation.navigateTransfer({
                    order: {
                        type: 'order',
                        messages: [{
                            target: src.to.toString({ testOnly: isTestnet }),
                            amount: src.value,
                            amountAll: false,
                            payload: src.payload,
                            stateInit: src.stateInit ? src.stateInit : null,
                        }],
                        app: {
                            domain,
                            title: name,
                            url
                        }
                    },
                    text: src.text ? src.text : null,
                    job: null,
                    callback: callback!,
                    back: 1
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: src.to.toString({ testOnly: isTestnet }),
                    amount: src.value,
                    stateInit: src.stateInit ? src.stateInit : null,
                    comment: src.text ? src.text : null,
                    job: null,
                    jetton: null,
                    callback: callback!,
                    back: 1,
                    app: {
                        domain,
                        title: name,
                        url
                    }
                });
            }

            return await future;
        });
        inj.registerMethod('sign', signCodec, signResponseCodec, async (src) => {

            // Check network
            if (isTestnet && src.network !== 'testnet') {
                throw Error('Invalid network');
            }
            if (!isTestnet && src.network !== 'mainnet') {
                throw Error('Invalid network');
            }

            // Callback
            let callback: (ok: boolean, res: Cell | null) => void;
            let future = new Promise<{ state: 'sent' | 'rejected', result: Cell | null }>((resolve) => {
                callback = (ok, res) => {
                    resolve({ state: ok ? 'sent' : 'rejected', result: res });
                };
            });

            // Navigation
            navigation.navigateSign({
                textCell: src.textCell,
                payloadCell: src.payloadCell,
                text: parseString(src.textCell.beginParse()),
                job: null,
                callback: callback!,
                name
            });

            return await future;
        });
        return inj;
    }, []);
}