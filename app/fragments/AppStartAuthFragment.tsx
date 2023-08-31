import { fragment } from "../fragment";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { useEffect } from "react";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";
import { resolveOnboarding } from "./resolveOnboarding";
import { useEngine } from "../engine/Engine";
import { t } from "../i18n/t";
import { FadeInDown } from "react-native-reanimated";

export const AppStartAuthFragment = fragment(() => {
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { AppConfig, Theme } = useAppConfig();

    useEffect(() => {
        (async () => {
            try {
                await authContext.authenticate({
                    backgroundColor: Theme.white,
                    cancelable: false,
                    showResetOnMaxAttempts: true,
                    description: t('appAuth.description'),
                    enteringAnimation: FadeInDown,
                    isAppStart: true,
                });
                const route = resolveOnboarding(engine, AppConfig.isTestnet, false);
                navigation.navigateAndReplaceAll(route);
            } catch {
                return;
            }
        })();
    }, []);

    return <></>;
});