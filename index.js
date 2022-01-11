global.Buffer = global.Buffer || require('buffer').Buffer;
import { registerRootComponent } from 'expo';
// Load i18n
import './app/i18n';
registerRootComponent(require('./App').default);
