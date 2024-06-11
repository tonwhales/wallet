import { atom } from 'recoil';

export const blockWatcherAtom = atom<'connecting' | 'connected'>({
    key: 'blockWatcherAtom',
    default: 'connecting'
});

export const lastWatchedBlockAtom = atom<{ seqno: number, lastUtime: number } | null>({
    key: 'lastWatchedBlockAtom',
    default: null
});