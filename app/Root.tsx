import * as React from 'react';
import { Navigation } from './Navigation';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RecoilRoot } from 'recoil';
import { RebootContext } from './utils/RebootContext';
import './utils/CachedLinking';
import { clientPersister } from './engine/queryClientPersister';
import { queryClient } from './engine/clients';

const PERSISTANCE_VERSION = '11';

export const Root = React.memo(() => {
    const [sessionId, setSessionId] = React.useState(0);
    const reboot = React.useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);

    return (
        <Animated.View
            key={'session-' + sessionId}
            style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
            exiting={FadeOut}
            entering={FadeIn}
        >
            <RebootContext.Provider value={reboot}>
                <PersistQueryClientProvider persistOptions={{ persister: clientPersister, buster: PERSISTANCE_VERSION }} client={queryClient}>
                    <RecoilRoot>
                        <Navigation />
                    </RecoilRoot>
                </PersistQueryClientProvider>
            </RebootContext.Provider>
        </Animated.View >
    );
});