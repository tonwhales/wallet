import { useEffect } from 'react';
import { BlocksWatcher } from './blocks/BlocksWatcher';
import { onAccountTouched } from './effects/onAccountTouched';
import { storage } from '../storage/storage';
import { onBlockMissed } from './effects/onBlockMissed';
import { useNetwork } from './hooks';
import { clients } from './clients';
import { useSetRecoilState } from 'recoil';
import { blockWatcherAtom } from './state/blockWatcherState';

let lastBlockResolve: ((block: number) => void) | undefined;
let lastBlockPromise: Promise<number> = new Promise((resolve) => {
    lastBlockResolve = resolve;
});

export function getLastBlock() {
    return lastBlockPromise;
}

export function useBlocksWatcher() {
    const { isTestnet } = useNetwork();
    const setState = useSetRecoilState(blockWatcherAtom);

    useEffect(() => {
        let watcher = new BlocksWatcher(isTestnet ? 'testnet-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com');
        let client = clients.ton[isTestnet ? 'testnet' : 'mainnet'];

        watcher.on('new_session', (data) => {
            setState('connected');
        });

        watcher.on('block', (data) => {
            lastBlockResolve?.(data.seqno);
            lastBlockResolve = undefined;
            lastBlockPromise = Promise.resolve(data.seqno);
            
            let lastBlock = storage.getNumber('lastBlock') || data.seqno;
            storage.set('lastBlock', data.seqno);
            if (lastBlock < data.seqno) {
                onBlockMissed(client, lastBlock, data.seqno, isTestnet);
            }

            let addresses = Object.keys(data.changed);
            for (let address of addresses) {
                onAccountTouched(address, isTestnet);
            }
        });

        return () => {
            watcher.stop();
        };
    }, [isTestnet]);
}