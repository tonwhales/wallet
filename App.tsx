// Crypto
global.Buffer = global.Buffer || require('buffer').Buffer
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
polyfillWebCrypto();

// Navigation
import 'react-native-gesture-handler';
import { enableFreeze, enableScreens } from 'react-native-screens';
enableScreens();
enableFreeze();

// Storage
import './app/utils/storage';

// App
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Navigation } from './app/Navigation';
import { NavigationContainer } from '@react-navigation/native';
export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </View>
    </>

  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    backgroundColor: 'purple',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
