// Crypto
global.Buffer = global.Buffer || require('buffer').Buffer;
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
polyfillWebCrypto();

// Navigation
import 'react-native-gesture-handler';
import { enableFreeze, enableScreens } from 'react-native-screens';
// enableScreens();
enableFreeze(false);

// Storage
import './app/utils/storage';

// App
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Navigation } from './app/Navigation';
import { NavigationContainer } from '@react-navigation/native';
import { NavigationTheme, Theme } from './app/Theme';
import AppLoading from 'expo-app-loading';
import { boot } from './app/boot';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function Boot() {
  const [ready, setReady] = React.useState(false);
  if (!ready) {
    return (
      <AppLoading
        startAsync={boot}
        onFinish={() => setReady(true)}
        onError={console.warn}
      />
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <NavigationContainer
            theme={NavigationTheme}
          >
            <Navigation />
          </NavigationContainer>
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
