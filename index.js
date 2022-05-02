global.Buffer = global.Buffer || require('buffer').Buffer;

// Disable warnings
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
    'Overwriting fontFamily style attribute',
    'Non-serializable values were found in the navigation state',
    'Fetching the token failed: MISSING'
]);

// Load i18n
import './app/i18n/i18n';

// Load app
import { registerRootComponent } from 'expo';
import 'react-native-reanimated'
registerRootComponent(require('./App').default);
