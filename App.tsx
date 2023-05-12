// Crypto
global.Buffer = global.Buffer || require('buffer').Buffer;
import { polyfillWebCrypto } from './app/utils/expo-standart-web-crypto/polyfillWebCrypto';
polyfillWebCrypto();

// Set up an PRNG for nacl with expo-crypto
import nacl from 'tweetnacl';
import { getRandomBytes } from 'expo-crypto'
nacl.setPRNG((x, n) => {
  // Get n random bytes from expo-crypto
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
import { StyleSheet, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Root } from './app/Root';
import { changeNavBarColor } from './app/components/modules/NavBar';
import * as SplashScreen from 'expo-splash-screen';

changeNavBarColor('white');

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
    backgroundColor: '#F2F2F6',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
