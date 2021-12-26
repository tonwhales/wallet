import 'react-native-gesture-handler';
import { enableFreeze, enableScreens } from 'react-native-screens';
enableScreens();
enableFreeze();

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Navigation } from './pages/Navigation';
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
