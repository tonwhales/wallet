import 'react-native'

export interface WebViewCacheModuleInterface {
  clearCache: () => void
}

declare module 'react-native' {
  interface NativeModulesStatic {
    WebViewCacheModule: WebViewCacheModuleInterface
  }
}
