import * as React from 'react';
import { Navigation } from './Navigation';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RecoilRoot } from 'recoil';
import { RebootContext } from './utils/RebootContext';
import './utils/CachedLinking';
import { clientPersister } from './engine/queryClientPersister';
import { queryClient } from './engine/clients';
import { LedgerTransportProvider } from './fragments/ledger/components/TransportContext';
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance';
import { memo, useCallback, useState } from 'react';
import { Mixpanel } from 'mixpanel-react-native';
import { LogBox } from 'react-native';
import { AddressBookLoader } from './engine/AddressBookContext';
import { ThemeProvider } from './engine/ThemeContext';
import { PriceLoader } from './engine/PriceContext';

const PERSISTANCE_VERSION = '20';

LogBox.ignoreAllLogs()

export const Root = memo(() => {
    const [sessionId, setSessionId] = useState(0);
    const reboot = useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);

    const onReportPrepared = useCallback((report: RenderPassReport) => {
        // send report to analytics
        if (__DEV__) {
            console.log('Render pass report', report);
            new Mixpanel("b4b856b618ade30de503c189af079566").track('react_native_performance', report);
        }
    }, []);

    return (
        <PerformanceProfiler
            onReportPrepared={onReportPrepared}
            enabled={__DEV__}
        >
            <Animated.View
                key={'session-' + sessionId}
                style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
                exiting={FadeOut}
                entering={FadeIn}
            >
                <RebootContext.Provider value={reboot}>
                    <PersistQueryClientProvider
                        persistOptions={{ persister: clientPersister, buster: PERSISTANCE_VERSION, maxAge: Infinity }}
                        client={queryClient}
                    >
                        <RecoilRoot>
                            <ThemeProvider>
                                <PriceLoader>
                                    <AddressBookLoader>
                                        <LedgerTransportProvider>
                                            <Navigation />
                                        </LedgerTransportProvider>
                                    </AddressBookLoader>
                                </PriceLoader>
                            </ThemeProvider>
                        </RecoilRoot>
                    </PersistQueryClientProvider>
                </RebootContext.Provider>
            </Animated.View>
        </PerformanceProfiler>
    );
});