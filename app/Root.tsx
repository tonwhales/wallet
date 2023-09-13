import * as React from 'react';
import { Navigation } from './Navigation';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RecoilRoot } from 'recoil';
import { RebootContext } from './utils/RebootContext';
import './utils/CachedLinking';
import { AppConfigContextProvider } from './utils/AppConfigContext';
import { AppStateManagerLoader } from './engine/AppStateManager';
import { LedgerTransportProvider } from './fragments/ledger/components/LedgerTransportProvider';
import { memo, useCallback, useState } from 'react';
import { SharedPersistence } from './engine/SharedPersistence';
import { SharedPersistenceLoader } from './engine/persistence/SharedResistenceLoader';

export const Root = memo(() => {
    const [sessionId, setSessionId] = useState(0);
    const reboot = useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);
    return (
        <LedgerTransportProvider>
            <RecoilRoot>
                <Animated.View
                    key={'session-' + sessionId}
                    style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
                    exiting={FadeOut}
                    entering={FadeIn}
                >
                    <RebootContext.Provider value={reboot}>
                        <AppConfigContextProvider>
                            <SharedPersistenceLoader>
                                <AppStateManagerLoader sessionId={sessionId}>
                                    <Navigation />
                                </AppStateManagerLoader>
                            </SharedPersistenceLoader>
                        </AppConfigContextProvider>
                    </RebootContext.Provider>
                </Animated.View>
            </RecoilRoot>
        </LedgerTransportProvider>
    );
});