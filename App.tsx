// Crypto
global.Buffer = global.Buffer || require('buffer').Buffer;
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
polyfillWebCrypto();

// Set up an PRNG for nacl with expo-random
import nacl from 'tweetnacl';
import { getRandomBytes } from 'expo-random';
nacl.setPRNG((x, n) => {
  // Get n random bytes from expo-random
  const randomBytes = getRandomBytes(n);

  // Copy the random bytes into x
  x.set(randomBytes);
});

// Navigation
import 'react-native-gesture-handler';

// Storage
import './app/storage/appState';

// App
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Theme } from './app/Theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Root } from './app/Root';
import { changeNavBarColor } from './app/components/modules/NavBar';
import { mixpanel } from './app/analytics/mixpanel';
import * as SplashScreen from 'expo-splash-screen';

changeNavBarColor('white');

mixpanel.init();
if (__DEV__) {
  mixpanel.setLoggingEnabled(true);
}

SplashScreen.preventAutoHideAsync();
function Boot() {
  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GestureHandlerRootView style={styles.container}>
          <Root />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  )
}

export default function App() {
  return (
    <Boot />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    backgroundColor: Theme.background,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
