polyfills
global.Buffer = global.Buffer || require('@craftzdog/react-native-buffer').Buffer;
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';

// Disable warnings
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
    'Overwriting fontFamily style attribute',
    'Non-serializable values were found in the navigation state',
    'Fetching the token failed: MISSING',
    'ViewPropTypes will be removed',
    'Duplicate atom key'
]);

// Load i18n
import './app/i18n/i18n';

// Load app
import { registerRootComponent } from 'expo';
import 'react-native-reanimated'
import App from './App';
registerRootComponent(App);
