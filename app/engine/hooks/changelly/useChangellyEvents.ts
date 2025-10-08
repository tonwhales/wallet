import { useCallback } from "react";
import { useRecoilState } from "recoil";
import { useNetwork } from "../network";
import { ChangellyEvents, changellyEventsAtom, ChangellyEventsEntry } from "../../state/changellyEvents";

export function useChangellyEvents() {
    const { isTestnet } = useNetwork();
    const [changellyEvents, setChangellyEvents] = useRecoilState(changellyEventsAtom);

    const saveChangellyEvents = useCallback((transactionId: string, events: ChangellyEventsEntry) => {
        setChangellyEvents((currentEvents) => {
            return {
                ...currentEvents,
                [transactionId]: {
                    ...currentEvents[transactionId],
                    ...events
                }
            };
        });
    }, [isTestnet, setChangellyEvents]);

    const removeObsoleteEvents = useCallback((validTransactionIds: string[]) => {
        setChangellyEvents((currentEvents) => {
            const filteredEvents: ChangellyEvents = {};

            for (const transactionId of validTransactionIds) {
                if (currentEvents[transactionId]) {
                    filteredEvents[transactionId] = currentEvents[transactionId];
                }
            }

            return filteredEvents;
        });
    }, [setChangellyEvents]);

    return {
        changellyEvents,
        saveChangellyEvents,
        removeObsoleteEvents,
    }
} 