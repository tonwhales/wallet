import React from "react"
import { fragment } from "../fragment";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { useEffect } from "react";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { resolveOnboarding } from "./resolveOnboarding";
import { t } from "../i18n/t";
import { FadeInDown } from "react-native-reanimated";
import { useNetwork, useTheme } from "../engine/hooks";

export const AppStartAuthFragment = fragment(() => {
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();

    useEffect(() => {
        (async () => {
            try {
                await authContext.authenticate({
                    backgroundColor: theme.backgroundPrimary,
                    cancelable: false,
                    showResetOnMaxAttempts: true,
                    description: t('appAuth.description'),
                    enteringAnimation: FadeInDown,
                    isAppStart: true,
                });
                const route = resolveOnboarding(network.isTestnet, false);;
                navigation.navigateAndReplaceAll(route);
            } catch {
                return;
            }
        })();
    }, []);

    return <></>;
});