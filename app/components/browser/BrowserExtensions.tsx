import { memo, useCallback } from 'react';
import { View, Image, Text, Alert, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { holdersUrl as resolveHoldersUrl } from '../../engine/api/holders/fetchUserState';
import { ConnectedApp } from '../../engine/hooks/dapps/useTonConnectExtenstions';
import { Typography } from '../styles';

export const EmptyIllustrations = {
  dark: require('@assets/empty-connections-dark.webp'),
  light: require('@assets/empty-connections.webp'),
};

export const BrowserExtensions = memo(({ onScroll }: { onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) => {
  const theme = useTheme();
  const safeArea = useSafeAreaInsets();
  const { isTestnet } = useNetwork();
  const bottomBarHeight = useBottomTabBarHeight();
  const dimensions = useWindowDimensions();
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

    navigation.navigateDAppWebView({
      lockNativeBack: true,
      safeMode: true,
      url: item.url,
      title: item.name ?? undefined,
      header: { title: { type: 'params', params: { title: item.name, domain } } },
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

  const onRemoveExtension = useCallback((key: string) => {
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
  }, [removeExtension]);

  let disconnectConnectApp = useCallback((key: string) => {
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
  }, [disconnectConnect]);

  return extensions.length === 0 && tonconnectApps.length === 0 ? (
    <View>
      <Image
        resizeMode={'center'}
        style={{
          height: dimensions.width - 32,
          width: dimensions.width - 32,
          marginTop: -20,
        }}
        source={EmptyIllustrations[theme.style]}
      />
      <Text
        style={[{
          marginHorizontal: 24,
          textAlign: 'center',
          color: theme.textPrimary,
        }, Typography.semiBold32_38]}>
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
