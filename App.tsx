// Set up an PRNG for nacl with expo-crypto
import nacl from 'tweetnacl';
import { getRandomBytes } from 'expo-crypto'
nacl.setPRNG((x, n) => {
  // Get n random bytes from expo-crypto
  const randomBytes = getRandomBytes(n);

  // Copy the random bytes into x
  x.set(randomBytes);
});

// install crypto polyfill for @solana
import { install } from 'react-native-quick-crypto';
import { install as installSolana } from '@solana/webcrypto-ed25519-polyfill';
install();
installSolana();

// Navigation
import 'react-native-gesture-handler';

// App
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, Appearance, Platform, DeviceEventEmitter } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Root } from './app/Root';
import * as SplashScreen from 'expo-splash-screen';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { getThemeStyleState } from './app/engine/state/theme';
import { AndroidAppearance } from './app/modules/AndroidAppearance';
import { handleLinkReceived } from './app/utils/CachedLinking';
import { initAppsFlyer } from './app/analytics/appsflyer';
import WonderPush from 'react-native-wonderpush';

const style = getThemeStyleState();
const scheme = Platform.OS === 'android'? AndroidAppearance.getColorScheme() : Appearance.getColorScheme();
const isDark = style === 'dark' || (style === 'system' && scheme === 'dark');

// Note that it is a bad practice to disable font scaling globally.
// TODO: extend Text and TextInput components to support or lock font scaling.
if (!(Text as any).defaultProps) {
  (Text as any).defaultProps = {};
  (Text as any).defaultProps.allowFontScaling = false;
}

if (!(TextInput as any).defaultProps) {
  (TextInput as any).defaultProps = {};
  (TextInput as any).defaultProps.allowFontScaling = false;
}

initAppsFlyer()
SplashScreen.preventAutoHideAsync();
WonderPush.subscribeToNotifications();

function Boot() {
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GestureHandlerRootView style={styles.container}>
          <ActionSheetProvider>
            <Root />
          </ActionSheetProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  )
}

export default function App(props: any) {
  const url = props?.url;

  // This listener is used to handle push notifications from expo on Android
  // We handle intents from Expo and Wonderpush in the native code
  // And send data to the JS layer when user clicks on the notification
  // This is done because of the conflict between Wonderpush and Expo FCM services
  // We expect that Wonderpush just receives notifications and opens the app
  // But Expo receives notifications, opens the app and handle deeplinks
  useEffect(() => {
    let pushNotificationListener = null;
    if (Platform.OS === 'android') {
      pushNotificationListener = DeviceEventEmitter.addListener(
        'pushNotificationOpened',
        (data) => {
            // Using setTimeout to defer link processing to allow the Event Loop to complete current tasks
            // and ensure the app is fully initialized before handling the deeplink
            setTimeout(() => {
              if (data.url && typeof data.url === 'string') {
                handleLinkReceived(data.url);
              }
            }, 100);
          }
        
      );
    }

    return () => {
      pushNotificationListener?.remove();
    };
  }, []);

  if (url && typeof url === 'string') {
    handleLinkReceived(url)
  }
  return (
    <Boot />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    backgroundColor: isDark ? '#1C1C1E' : 'white',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
