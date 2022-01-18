import * as React from 'react';
import { fragment } from '../../fragment';

export const SyncFragment = fragment(() => {
    React.useEffect(() => {
        let ended = false;
        (async () => {
            if (ended) {
                return;
            }
            
        })();
        return () => {
            ended = true;
        };
    }, []);
    return null;
});