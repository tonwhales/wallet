import { atom } from 'recoil';

export const blockWatcherAtom = atom<'connecting' | 'connected'>({
    key: 'blockWatcherAtom',
    default: 'connecting'
});