import { useEffect } from 'react';
import { BlocksWatcher } from './blocks/BlocksWatcher';
import { onAccountTouched } from './effects/onAccountTouched';

export function useBlocksWatcher() {
    useEffect(() => {
        let watcher = new BlocksWatcher('mainnet-v4.tonhubapi.com');

        watcher.on('block', (data) => {
            let addresses = Object.keys(data);
            for (let address of addresses) {
                onAccountTouched(address);
            }
        });
    }, []);
}