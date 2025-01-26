import { useEffect } from 'react';
import { BlocksWatcher } from './blocks/BlocksWatcher';
import { onAccountsTouched } from './effects/onAccountTouched';
import { storage } from '../storage/storage';
import { onBlockMissed } from './effects/onBlockMissed';
import { useAppVisible, useNetwork } from './hooks';
import { clients } from './clients';
import { useSetRecoilState } from 'recoil';
import { blockWatcherAtom, lastWatchedBlockAtom } from './state/blockWatcherState';
import { Address } from '@ton/core';
import { focusManager } from '@tanstack/react-query';

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
    const setLastBlock = useSetRecoilState(lastWatchedBlockAtom);
    const appStateVisible = useAppVisible();

    useEffect(() => {
        let watcher: BlocksWatcher | undefined;

        const isActive = appStateVisible === 'active';

        focusManager.setFocused(isActive);
        
        if (isActive) {
            watcher = new BlocksWatcher(isTestnet ? 'testnet-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com');
            let client = clients.ton[isTestnet ? 'testnet' : 'mainnet'];

            watcher.on('new_session', (data) => {
                setState('connected');
            });

            watcher.on('block', (data) => {
                lastBlockResolve?.(data.seqno);
                lastBlockResolve = undefined;
                lastBlockPromise = Promise.resolve(data.seqno);
                setLastBlock({ seqno: data.seqno, lastUtime: data.lastUtime });

                // get last block from storage & compare to check for missed blocks
                const lastBlock = storage.getNumber('lastBlock') || data.seqno;
                storage.set('lastBlock', data.seqno);

                if (lastBlock < data.seqno) {
                    onBlockMissed(client, lastBlock, data.seqno, isTestnet);
                }

                let addresses = new Set<string>(Object.keys(data.changed));

                if (isTestnet) {
                    addresses = new Set([...addresses].map(a => Address.parse(a).toString({ testOnly: isTestnet })));
                }

                onAccountsTouched(addresses);
            });
        }

        return () => {
            watcher?.stop();
        };
    }, [isTestnet, appStateVisible]);
}