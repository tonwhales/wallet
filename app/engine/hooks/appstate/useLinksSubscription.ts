import { useEffect } from "react";
import { useLinkNavigator } from "../../../utils/link-navigator/useLinkNavigator";
import { Platform } from "react-native";
import { useNetwork } from "..";
import { TonConnectAuthType } from "../../../fragments/secure/dapps/TonConnectAuthenticateFragment";
import { CachedLinking } from "../../../utils/CachedLinking";
import { shouldLockApp } from "../../../components/SessionWatcher";
import { resolveUrl } from "../../../utils/url/resolveUrl";
import * as SplashScreen from 'expo-splash-screen';

export const useLinksSubscription = (options?: { isLedger?: boolean }) => {
    const network = useNetwork();
    const linkNavigator = useLinkNavigator(
        network.isTestnet,
        { marginBottom: Platform.select({ ios: 32 + 64, android: 16 }) },
        TonConnectAuthType.Link,
        options?.isLedger
    );
    useEffect(() => {
        return CachedLinking.setListener((link: string) => {
            // persist link in memory to reuse after app auth
            if (shouldLockApp()) {
                return link;
            }

            let resolved = resolveUrl(link, network.isTestnet);
            if (resolved) {
                try {
                    SplashScreen.hideAsync();
                } catch (e) {
                    // Ignore
                }
                linkNavigator(resolved);
            }
            return null;
        });
    }, []);
}