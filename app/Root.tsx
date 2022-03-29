import * as React from 'react';
import { Navigation } from './Navigation';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RecoilRoot } from 'recoil';
import { RebootContext } from './utils/RebootContext';
import './utils/CachedLinking';
import { useAuth } from './utils/AuthContext';

export const Root = React.memo(() => {
    const auth = useAuth();
    const [sessionId, setSessionId] = React.useState(0);
    const reboot = React.useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);

    const reqAuth = React.useCallback(
        () => {
            auth?.authenticate({
                onSuccess: () => { /* Ignore */ },
                onError: () => {
                    reqAuth();
                }
            })
        },
        [],
    );

    React.useEffect(() => {
        reqAuth();
    }, [])
    return (
        <Animated.View
            key={'session-' + sessionId}
            style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
            exiting={FadeOut}
            entering={FadeIn}
        >
            <RebootContext.Provider value={reboot}>
                <RecoilRoot>
                    <Navigation />
                </RecoilRoot>
            </RebootContext.Provider>
        </Animated.View>
    );
});