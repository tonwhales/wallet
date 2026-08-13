import { memo, useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Linking, Platform, Text, View } from "react-native";
import Modal from "react-native-modal";
import Intercom, { Space } from "@intercom/intercom-react-native";
import { NavigationContainerRefWithCurrent, StackActions } from "@react-navigation/native";
import { useNetwork, useTheme } from "../engine/hooks";
import { useAppVersionsConfig } from "../engine/hooks/useAppVersionsConfig";
import { useIntercomLoginRetry, useSupportAuthState } from "../engine/hooks/support/useSupportAuth";
import { forceUpdateState } from "../utils/newVersionUrl";
import { t } from "../i18n/t";
import { Typography } from "./styles";
import { RoundButton } from "./RoundButton";
import { useToaster } from "./toast/ToastProvider";
import { MixpanelEvent, trackEvent } from "../analytics/mixpanel";
import * as Application from 'expo-application';

// A React Native Modal is presented from the root view controller, so it silently fails
// to appear while a natively presented screen (every `presentation: 'modal'` route —
// Transfer, TonConnectSign, AppAuth …) is on screen. Dismissing those first is what makes
// "blocks the whole app" actually true; this is how long that dismissal takes to animate
const DISMISS_ANIMATION_MS = 450;

// Blocks the whole app when the running build is older than the minimal version
// the backend still supports. Mounted next to the navigation container (not inside
// a screen), so it covers every route — onboarding, wallet, cards webview, Ledger
export const ForceUpdateGate = memo((
    { ready, navRef }: { ready: boolean, navRef: NavigationContainerRefWithCurrent<any> }
) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const versions = useAppVersionsConfig();
    const isLoggedIn = useSupportAuthState();
    const retryLogin = useIntercomLoginRetry();
    const toaster = useToaster();

    // Conditions live in forceUpdateState() so they can be tested — see newVersionUrl.spec.ts
    const mountedAtRef = useRef(Date.now());
    const url = forceUpdateState({
        config: versions.data,
        isSuccess: versions.isSuccess,
        dataUpdatedAt: versions.dataUpdatedAt,
        mountedAt: mountedAtRef.current,
        ready
    });
    const isBlocked = !!url;

    // Presented separately from `isBlocked` so natively presented screens can be
    // dismissed first — see DISMISS_ANIMATION_MS
    const [isPresented, setPresented] = useState(false);

    useEffect(() => {
        if (!isBlocked) {
            setPresented(false);
            return;
        }

        try {
            if (navRef.isReady() && navRef.canGoBack()) {
                navRef.dispatch(StackActions.popToTop());
            }
        } catch {
            // A failed dismissal must not keep the dialog from showing at all
        }

        const timer = setTimeout(() => setPresented(true), DISMISS_ANIMATION_MS);
        return () => clearTimeout(timer);
    }, [isBlocked, navRef]);

    const trackedRef = useRef(false);
    useEffect(() => {
        if (!isBlocked) {
            // Reset so a block that comes back later in the same session is recorded too
            trackedRef.current = false;
            return;
        }
        if (trackedRef.current) {
            return;
        }
        trackedRef.current = true;
        trackEvent(
            MixpanelEvent.ForceUpdate,
            {
                platform: Platform.OS,
                // Without these there is no way to tell afterwards who got blocked and why
                currentVersion: Application.nativeApplicationVersion ?? 'unknown',
                minimal: versions.data?.[Platform.OS === 'android' ? 'android' : 'ios']?.minimal ?? 'unknown'
            },
            isTestnet
        );
    }, [isBlocked, isTestnet, versions.data]);

    // Android hardware back must not dismiss the dialog. react-native-modal only
    // handles the press while its own modal has focus, so guard at the app level too
    useEffect(() => {
        if (!isBlocked) {
            return;
        }
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [isBlocked]);

    const onUpdate = useCallback(async () => {
        if (!url) {
            return;
        }
        trackEvent(MixpanelEvent.ButtonPress, { button: 'force_update_store' }, isTestnet);
        try {
            await Linking.openURL(url);
        } catch {
            // The store link is the only way out of here, so a dead one must not fail silently
            toaster.show({ message: t('common.somethingWentWrong'), type: 'error' });
        }
    }, [url, isTestnet, toaster]);

    const onSupport = useCallback(async () => {
        trackEvent(MixpanelEvent.ButtonPress, { button: 'force_update_support' }, isTestnet);
        try {
            // Support is the only escalation path left to a blocked user — retry the login
            // instead of dropping the tap, and say something when it still doesn't work
            if (!isLoggedIn && !(await retryLogin())) {
                toaster.show({ message: t('common.somethingWentWrong'), type: 'error' });
                return;
            }
            await Intercom.presentSpace(Space.messages);
        } catch {
            toaster.show({ message: t('common.somethingWentWrong'), type: 'error' });
        }
    }, [isLoggedIn, retryLogin, isTestnet, toaster]);

    if (!isBlocked) {
        return null;
    }

    return (
        <Modal
            isVisible={isPresented}
            useNativeDriver={true}
            statusBarTranslucent={true}
            backdropOpacity={0.6}
            animationIn={'fadeIn'}
            animationOut={'fadeOut'}
        // No onBackdropPress / onBackButtonPress: the dialog is not dismissable
        >
            <View style={{
                borderRadius: 20, padding: 20,
                backgroundColor: theme.backgroundPrimary,
                justifyContent: 'center', alignItems: 'center'
            }}>
                <Text
                    style={[
                        { color: theme.textPrimary, textAlign: 'center', marginBottom: 8 },
                        Typography.semiBold17_24
                    ]}
                >
                    {t('update.forceTitle')}
                </Text>
                <Text
                    style={[
                        { color: theme.textSecondary, textAlign: 'center', marginBottom: 20 },
                        Typography.regular15_20
                    ]}
                >
                    {t('update.forceDescription')}
                </Text>
                <RoundButton
                    title={t('update.callToAction')}
                    onPress={onUpdate}
                    style={{ alignSelf: 'stretch' }}
                />
                <RoundButton
                    title={t('update.forceSupport')}
                    display={'secondary'}
                    onPress={onSupport}
                    style={{ alignSelf: 'stretch', marginTop: 12 }}
                />
            </View>
        </Modal>
    );
});
