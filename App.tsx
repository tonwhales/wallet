// Crypto
global.Buffer = global.Buffer || require('buffer').Buffer;
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
polyfillWebCrypto();

// Navigation
import 'react-native-gesture-handler';
// import { enableFreeze, enableScreens } from 'react-native-screens';
// enableScreens();
// enableFreeze(false);

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
import { storage } from './app/storage/storage';

changeNavBarColor('white');

mixpanel.init();
if (__DEV__) {
  mixpanel.setLoggingEnabled(true);
}

const startTime = performance.now();
storage.set('startTime', startTime);

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
