import * as React from 'react';
import { Navigation } from './Navigation';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RecoilRoot } from 'recoil';
import { getAppState } from './storage/appState';

const RebootContext = React.createContext<() => void>(() => { });
const IsTestnetContext = React.createContext(false);

export function useReboot() {
    return React.useContext(RebootContext);
}

export function useTestnet() {
    return React.useContext(IsTestnetContext);
}

export const Root = React.memo(() => {
    const [sessionId, setSessionId] = React.useState(0);
    const reboot = React.useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);
    const isTestnet = React.useMemo(() => {
        let r = getAppState();
        if (r) {
            return r.testnet;
        } else {
            return false;
        }
    }, [sessionId]);
    return (
        <Animated.View
            key={'session-' + sessionId}
            style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
            exiting={FadeOut}
            entering={FadeIn}
        >
            <IsTestnetContext.Provider value={isTestnet}>
                <RebootContext.Provider value={reboot}>
                    <RecoilRoot>
                        <Navigation />
                    </RecoilRoot>
                </RebootContext.Provider>
            </IsTestnetContext.Provider>
        </Animated.View>
    );
});