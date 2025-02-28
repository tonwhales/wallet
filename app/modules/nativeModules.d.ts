import 'react-native'

export interface WebViewCacheModuleInterface {
  clearCache: () => void
}
export interface FlagSecureModuleInterface {
  activate: () => void
  deactivate: () => void
}

declare module 'react-native' {
  interface NativeModulesStatic {
    WebViewCacheModule: WebViewCacheModuleInterface
    FlagSecureModule: FlagSecureModuleInterface
  }
}
