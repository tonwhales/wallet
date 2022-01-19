global.Buffer = global.Buffer || require('buffer').Buffer;
import { registerRootComponent } from 'expo';
import 'react-native-reanimated'
// Load i18n
import './app/i18n';
registerRootComponent(require('./App').default);
