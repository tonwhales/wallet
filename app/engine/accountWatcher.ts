import { useEffect } from 'react';
import { BlocksWatcher } from './blocks/BlocksWatcher';
import { onAccountTouched } from './effects/onAccountTouched';
import { storage } from '../storage/storage';
import { onBlockMissed } from './effects/onBlockMissed';
import { useFilteredHints, useNetwork, useSelectedAccount } from './hooks';
import { clients } from './clients';
import { useSetRecoilState } from 'recoil';
import { blockWatcherAtom } from './state/blockWatcherState';
import { useLedgerTransport } from '../fragments/ledger/components/TransportContext';
import { Address } from '@ton/core';

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
    const ledger = useLedgerTransport().addr;
    const selectedAccount = useSelectedAccount();
    const hints = useFilteredHints(
        selectedAccount?.addressString ?? '',
        (a) => !!a.jettonWallet
            && a.jettonWallet?.owner === (selectedAccount?.addressString ?? '')
            && !!a.jettonWallet.master
    ).map(a => a.address);

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

            const lastBlockKey = `lastBlock-${selectedAccount?.addressString || ''}`;
            const lastBlock = storage.getNumber(lastBlockKey) || data.seqno;

            storage.set(lastBlockKey, data.seqno);

            const accsToSync = [
                ...hints,
                ...(selectedAccount ? [selectedAccount.addressString] : []),
                ...(ledger ? [Address.parse(ledger.address).toString({ testOnly: isTestnet })] : []),
            ].map(a => Address.parse(a).toString({ testOnly: isTestnet }));
            
            if (lastBlock < data.seqno) {
                onBlockMissed(client, lastBlock, data.seqno, isTestnet, accsToSync);
            }
            
            let addresses = Object.keys(data.changed)
            .map((a) => Address.parse(a).toString({ testOnly: isTestnet }))
            .filter((a) => accsToSync.includes(a));
            
            for (let address of addresses) {
                onAccountTouched(address, isTestnet);
            }
        });

        return () => {
            watcher.stop();
        };
    }, [isTestnet, ledger, selectedAccount, hints]);
}