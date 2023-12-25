import { NativeMethods, TextComponent } from 'react-native'

type Constructor<T> = new (...args: any[]) => T

export const PerfText: Constructor<NativeMethods> & typeof TextComponent = require('react-native/Libraries/Text/TextNativeComponent').NativeText