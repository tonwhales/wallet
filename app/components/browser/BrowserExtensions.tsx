import { memo, useCallback } from "react";
import { View, Image, Text, Platform, Alert } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ConnectionButton } from "../ConnectionButton";
import { useDisconnectApp, useExtensions, useRemoveExtension, useTheme, useTonConnectExtensions } from "../../engine/hooks";
import { getCachedAppData } from "../../engine/getters/getAppData";
import { t } from "../../i18n/t";
import { getDomainKey } from "../../engine/state/domainKeys";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useDimensions } from "@react-native-community/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const EmptyIllustrations = {
    dark: require('@assets/empty-connections-dark.webp'),
    light: require('@assets/empty-connections.webp')
}

export const BrowserExtensions = memo(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const dimensions = useDimensions();
    const navigation = useTypedNavigation();
    const [installedExtensions,] = useExtensions();
    const [inastalledConnectApps,] = useTonConnectExtensions();

    const extensions = Object.entries(installedExtensions.installed).map(([key, ext]) => {
        const appData = getCachedAppData(ext.url);
        return { ...ext, key, title: appData?.title || ext.title || ext.url }
    });
    const tonconnectApps = Object.entries(inastalledConnectApps).map(([key, ext]) => ({ ...ext, key }));

    const removeExtension = useRemoveExtension();
    const disconnectConnect = useDisconnectApp();

    const openExtension = useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = getDomainKey(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);

    const onRemoveExtension = useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                removeExtension(key);
            }
        }]);
    }, [removeExtension]);

    let disconnectConnectApp = useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                disconnectConnect(key, 0);
            }
        }]);
    }, [disconnectConnect]);

    return (extensions.length === 0 && tonconnectApps.length === 0) ? (
        <View style={{
            flexGrow: 1,
            justifyContent: 'center', alignItems: 'center',
            paddingBottom: bottomBarHeight
        }}>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                width: dimensions.screen.width - 32,
                height: (dimensions.screen.width - 32) * 0.91,
                borderRadius: 20, overflow: 'hidden',
                marginBottom: 22,
            }}>
                <Image
                    resizeMode={'center'}
                    style={{ height: dimensions.screen.width - 32, width: dimensions.screen.width - 32, marginTop: -20 }}
                    source={EmptyIllustrations[theme.style]}
                />
            </View>
            <Text style={{
                fontSize: 32,
                fontWeight: '600',
                marginHorizontal: 24,
                textAlign: 'center',
                color: theme.textPrimary,
            }}>
                {t('auth.noExtensions')}
            </Text>
        </View>
    ) : (
        <Animated.ScrollView
            entering={FadeIn}
            exiting={FadeOut}
            contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
            style={{ flexGrow: 1, marginTop: 24, }}
        >
            <View style={{
                marginBottom: 16, marginTop: 0,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                {extensions.map((app, index) => (
                    <View key={`app-${app.url}`} style={{ width: '100%', marginTop: index === 0 ? 0 : 8, marginBottom: 8 }}>
                        <ConnectionButton
                            onPress={() => openExtension(app.url)}
                            onRevoke={() => onRemoveExtension(app.url)}
                            onLongPress={() => onRemoveExtension(app.url)}
                            url={app.url}
                            name={app.title}
                        />
                    </View>
                ))}
                {tonconnectApps.map((app, index) => (
                    <View
                        key={`app-${app.url}`}
                        style={{ width: '100%', marginTop: (index === 0 && extensions.length === 0) ? 0 : 8, marginBottom: 8 }}
                    >
                        <ConnectionButton
                            onRevoke={() => disconnectConnectApp(app.url)}
                            onPress={() => navigation.navigate('ConnectApp', { url: app.url })}
                            url={app.url}
                            name={app.name}
                            tonconnect
                        />
                    </View>
                ))}
                <View style={{ height: Platform.OS === 'android' ? 64 : safeArea.bottom }} />
            </View>
        </Animated.ScrollView>
    );
});