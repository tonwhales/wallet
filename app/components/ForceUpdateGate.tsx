import { memo, useCallback, useEffect, useRef } from "react";
import { BackHandler, Linking, Platform, Text, View } from "react-native";
import Modal from "react-native-modal";
import Intercom, { Space } from "@intercom/intercom-react-native";
import { useNetwork, useTheme } from "../engine/hooks";
import { useAppVersionsConfig } from "../engine/hooks/useAppVersionsConfig";
import { useIntercomLoginRetry, useSupportAuthState } from "../engine/hooks/support/useSupportAuth";
import { forceUpdateUrl } from "../utils/newVersionUrl";
import { t } from "../i18n/t";
import { Typography } from "./styles";
import { RoundButton } from "./RoundButton";
import { MixpanelEvent, trackEvent } from "../analytics/mixpanel";

// Blocks the whole app when the running build is older than the minimal version
// the backend still supports. Mounted next to the navigation container (not inside
// a screen), so it covers every route — onboarding, wallet, cards webview, Ledger
export const ForceUpdateGate = memo(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const versions = useAppVersionsConfig();
    const isLoggedIn = useSupportAuthState();
    const retryLogin = useIntercomLoginRetry();

    const url = forceUpdateUrl(versions.data);
    const isBlocked = !!url;

    const trackedRef = useRef(false);
    useEffect(() => {
        if (isBlocked && !trackedRef.current) {
            trackedRef.current = true;
            trackEvent(MixpanelEvent.ForceUpdate, { platform: Platform.OS }, isTestnet);
        }
    }, [isBlocked, isTestnet]);

    // Android hardware back must not dismiss the dialog. react-native-modal only
    // handles the press while its own modal has focus, so guard at the app level too
    useEffect(() => {
        if (!isBlocked) {
            return;
        }
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [isBlocked]);

    const onUpdate = useCallback(() => {
        if (url) {
            Linking.openURL(url).catch(() => { });
        }
    }, [url]);

    const onSupport = useCallback(async () => {
        try {
            if (!isLoggedIn) {
                await retryLogin();
            }
            await Intercom.presentSpace(Space.messages);
        } catch { }
    }, [isLoggedIn, retryLogin]);

    if (!isBlocked) {
        return null;
    }

    return (
        <Modal
            isVisible={true}
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
