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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ModalProvider } from './app/components/FastModal/ModalProvider';
import { Root } from './app/Root';
import * as SplashScreen from 'expo-splash-screen';


SplashScreen.preventAutoHideAsync()
  .then(result => console.log(`SplashScreen.preventAutoHideAsync() succeeded: ${result}`))
  .catch(console.warn);

function Boot() {
  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <Root />
        </GestureHandlerRootView>
        <ModalProvider />
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
    backgroundColor: 'white',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
