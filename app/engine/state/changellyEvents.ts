import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

const changellyEventsKey = 'changellyEvents';

export type ChangellyEventsEntry = {
    isDepositFromTonhubDone: boolean
};

export type ChangellyEvents = Record<string, ChangellyEventsEntry>;

export function getChangellyEvents(): ChangellyEvents {
    const stored = sharedStoragePersistence.getString(changellyEventsKey);
    if (!stored) return {};
    
    try {
        return JSON.parse(stored);
    } catch (e) {
        return {};
    }
}

export function setChangellyEvents(events: ChangellyEvents) {
    sharedStoragePersistence.set(changellyEventsKey, JSON.stringify(events));
}

export const changellyEventsAtom = atom<ChangellyEvents>({
    key: 'wallet/changellyEvents',
    default: getChangellyEvents(),
    effects: [
        ({ onSet, setSelf }) => {
            const stored = getChangellyEvents();
            setSelf(stored);

            onSet((events) => {
                setChangellyEvents(events);
            });
        }
    ]
}); 