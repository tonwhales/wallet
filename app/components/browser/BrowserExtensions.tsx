import { memo, useCallback } from 'react';
import { View, Image, Text, Alert, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ConnectionButton } from '../ConnectionButton';
import {
  useDisconnectApp,
  useExtensions,
  useNetwork,
  useRemoveExtension,
  useTheme,
  useTonConnectExtensions,
} from '../../engine/hooks';
import { getCachedAppData } from '../../engine/getters/getAppData';
import { t } from '../../i18n/t';
import { getDomainKey } from '../../engine/state/domainKeys';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useDimensions } from '@react-native-community/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { holdersUrl as resolveHoldersUrl } from '../../engine/api/holders/fetchUserState';
import { Typography } from '../styles';
import { ConnectedApp } from '../../engine/hooks/dapps/useTonConnectExtenstions';

export const EmptyIllustrations = {
  dark: require('@assets/empty-connections-dark.webp'),
  light: require('@assets/empty-connections.webp'),
};

export const BrowserExtensions = memo(
  ({ onScroll }: { onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const bottomBarHeight = useBottomTabBarHeight();
    const dimensions = useDimensions();
    const navigation = useTypedNavigation();
    const [installedExtensions] = useExtensions();
    const [inastalledConnectApps] = useTonConnectExtensions();
    const holdersUrl = resolveHoldersUrl(isTestnet);

    const extensions = Object.entries(installedExtensions.installed).map(([key, ext]) => {
      const appData = getCachedAppData(ext.url);
      return { ...ext, key, title: appData?.title || ext.title || ext.url };
    });

    const tonconnectApps = Object.entries(inastalledConnectApps)
      .map(([key, ext]) => ({ ...ext, key }))
      .filter((v) => v.url !== holdersUrl);

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

    const openTonconnectApp = useCallback((item: ConnectedApp) => {
      const domain = extractDomain(item.url);
      const titleComponent = (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ marginRight: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.accent,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                {domain.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {item.name && (
              <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                {item.name}
              </Text>
            )}
            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>{domain}</Text>
          </View>
        </View>
      );

      navigation.navigateDAppWebView({
        lockNativeBack: true,
        safeMode: true,
        url: item.url,
        title: item.name ?? undefined,
        header: { titleComponent },
        useStatusBar: true,
        engine: 'ton-connect',
        controlls: {
          refresh: true,
          share: true,
          back: true,
          forward: true,
        },
      });
    }, []);

    const onRemoveExtension = useCallback(
      (key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [
          { text: t('common.cancel') },
          {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
              removeExtension(key);
            },
          },
        ]);
      },
      [removeExtension],
    );

    let disconnectConnectApp = useCallback(
      (key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [
          { text: t('common.cancel') },
          {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
              disconnectConnect(key, 0);
            },
          },
        ]);
      },
      [disconnectConnect],
    );

    return extensions.length === 0 && tonconnectApps.length === 0 ? (
      <View>
        <Image
          resizeMode={'center'}
          style={{
            height: dimensions.screen.width - 32,
            width: dimensions.screen.width - 32,
            marginTop: -20,
          }}
          source={EmptyIllustrations[theme.style]}
        />
        <Text
          style={{
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
        style={{ flexGrow: 1 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        {extensions.map((app) => (
          <View key={`ton-x-app-${app.url}`} style={{ width: '100%' }}>
            <ConnectionButton
              onPress={() => openExtension(app.url)}
              onRevoke={() => onRemoveExtension(app.url)}
              onLongPress={() => onRemoveExtension(app.url)}
              url={app.url}
              name={app.title}
            />
          </View>
        ))}
        {tonconnectApps.map((app) => (
          <View key={`connect-app-${app.url}`} style={{ width: '100%' }}>
            <ConnectionButton
              onRevoke={() => disconnectConnectApp(app.url)}
              onPress={() => openTonconnectApp(app)}
              url={app.url}
              name={app.name}
              tonconnect
            />
          </View>
        ))}
        <View style={{ height: bottomBarHeight + safeArea.top + safeArea.bottom + 256 }} />
      </Animated.ScrollView>
    );
  },
);
