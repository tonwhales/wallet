import { View } from "react-native";
import { fragment } from "../fragment";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { Splash } from "../components/Splash";
import { useEffect } from "react";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";
import { resolveOnboarding } from "./resolveOnboarding";
import { useEngine } from "../engine/Engine";

export const AppStartAuthFragment = fragment(() => {
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { AppConfig } = useAppConfig();

    useEffect(() => {
        (async () => {
            try {
                await authContext.authenticate({ backgroundColor: 'white', cancelable: false });
                const route = resolveOnboarding(engine, AppConfig.isTestnet, false);
                navigation.navigateAndReplaceAll(route);
            } catch {
                return;
            }
        })();
    }, []);

    return (
        <Splash hide={false} />
    );
});