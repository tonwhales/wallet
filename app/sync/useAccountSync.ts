import * as React from 'react';
import BN from "bn.js";
import { Address } from "ton";
import { storage } from '../utils/storage';
import { backoff } from '../utils/time';
import { fetchBalance } from '../client';
import { delay } from 'teslabot';

export function useAccountSync(address: Address): [BN | null, boolean] {
    const [balance, setBalance] = React.useState<BN | null>(() => {
        let ex = storage.getString('balance_' + address.toFriendly());
        if (ex) {
            return new BN(ex, 10);
        } else {
            return null;
        }
    });
    const [loading, setLoading] = React.useState<boolean>(true);
    React.useEffect(() => {
        (async () => {
            backoff(async () => {
                while (true) {
                    let value = await fetchBalance(address);
                    storage.set('balance_' + address.toFriendly(), value.toString(10));
                    setBalance(value);
                    setLoading(false);
                    await delay(5000);
                }
            })
        })();
    }, []);
    return [balance, loading];
}