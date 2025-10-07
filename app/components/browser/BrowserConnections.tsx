import { memo, useCallback, useState } from 'react';
import { useTheme } from '../../engine/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  View,
  Image,
  Text,
  Platform,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EmptyIllustrations } from './BrowserExtensions';
import { t } from '../../i18n/t';
import { ConnectionButton } from '../ConnectionButton';
import {
  addPendingRevoke,
  getConnectionReferences,
  removeConnectionReference,
  removePendingRevoke,
} from '../../storage/appState';
import { backoff } from '../../utils/time';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { whalesConnectEndpoint } from '../../engine/clients';

type Item = {
  key: string;
  name: string;
  url: string;
  date: number;
};

type GroupedItems = {
  name: string;
  url: string;
  items: Item[];
};

function groupItems(items: Item[]): GroupedItems[] {
  let sorted = [...items].sort((a, b) => b.date - a.date);
  let groups: GroupedItems[] = [];
  for (let s of sorted) {
    let g = groups.find((v) => v.url.toLowerCase() === s.url.toLowerCase());
    if (g) {
      g.items.push(s);
    } else {
      groups.push({
        name: s.name,
        url: s.url,
        items: [s],
      });
    }
  }
  return groups;
}

export const BrowserConnections = memo(
  ({ onScroll }: { onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const dimensions = useWindowDimensions();

    let [apps, setApps] = useState(groupItems(getConnectionReferences()));

    const onDisconnectApp = useCallback((url: string) => {
      let refs = getConnectionReferences();
      let toRemove = refs.filter((v) => v.url.toLowerCase() === url.toLowerCase());
      if (toRemove.length === 0) {
        return;
      }

      Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [
        { text: t('common.cancel') },
        {
          text: t('auth.revoke.action'),
          style: 'destructive',
          onPress: () => {
            for (let s of toRemove) {
              addPendingRevoke(s.key);
              removeConnectionReference(s.key);
              backoff('revoke', async () => {
                await axios.post(
                  `${whalesConnectEndpoint}/connect/revoke`,
                  { key: s.key },
                  { timeout: 5000 },
                );
                removePendingRevoke(s.key);
              });
            }
            setApps(groupItems(getConnectionReferences()));
          },
        },
      ]);
    }, []);

    useFocusEffect(
      useCallback(() => {
        setApps(groupItems(getConnectionReferences()));
      }, []),
    );

    return apps.length === 0 ? (
      <View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: dimensions.width - 32,
            height: (dimensions.width - 32) * 0.91,
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 22,
          }}>
          <Image
            resizeMode={'center'}
            style={{
              height: dimensions.width - 32,
              width: dimensions.width - 32,
              marginTop: -20,
            }}
            source={EmptyIllustrations[theme.style]}
          />
        </View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '600',
            marginHorizontal: 24,
            textAlign: 'center',
            color: theme.textPrimary,
          }}>
          {t('auth.noApps')}
        </Text>
      </View>
    ) : (
      <Animated.ScrollView
        entering={FadeIn}
        exiting={FadeOut}
        contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
        style={{ flexGrow: 1, marginTop: 24 }}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View
          style={{
            marginBottom: 16,
            marginTop: 0,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 1,
          }}>
          {apps.map((app) => (
            <View key={`app-${app.url}`} style={{ width: '100%', marginBottom: 8 }}>
              <ConnectionButton
                onRevoke={() => onDisconnectApp(app.url)}
                url={app.url}
                name={app.name}
              />
            </View>
          ))}
        </View>
        <View style={{ height: Platform.OS === 'android' ? 64 : safeArea.bottom }} />
      </Animated.ScrollView>
    );
  },
);
