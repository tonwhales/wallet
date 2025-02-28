import 'react-native'

export interface FlagSecureModuleInterface {
  activate: () => void
  deactivate: () => void
}

declare module 'react-native' {
  interface NativeModulesStatic {
    FlagSecureModule: FlagSecureModuleInterface
  }
}
