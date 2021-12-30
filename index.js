global.Buffer = global.Buffer || require('buffer').Buffer;
import { registerRootComponent } from 'expo';
registerRootComponent(require('./App').default);
