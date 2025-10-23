import Foundation
import UIKit
import Expo
import ReactNativePerformance
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
    var window: UIWindow?

    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?
    
    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        ReactNativePerformance.onAppStarted()
        
        // Initialize Intercom
        if let apiKey = Bundle.main.object(forInfoDictionaryKey: "INTERCOM_IOS_API") as? String,
           let appId = Bundle.main.object(forInfoDictionaryKey: "INTERCOM_APP") as? String {
            IntercomModule.initialize(apiKey, withAppId: appId)
        }
        
        // Disable iCloud backup for Documents directory
        if let urlArray = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            var documentsUrl = urlArray
            do {
                var resourceValues = URLResourceValues()
                resourceValues.isExcludedFromBackup = true
                try documentsUrl.setResourceValues(resourceValues)
                print("Documents directory backup disabled")
            } catch {
                print("Error in disabling \(documentsUrl.lastPathComponent) from backup: \(error)")
            }
        }
        
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        window = UIWindow(frame: UIScreen.main.bounds)
        
        UIDevice.current.isBatteryMonitoringEnabled = true

        factory.startReactNative(
            withModuleName: "main",
            in: window,
            launchOptions: launchOptions
        )
 
        return true
    }
    
    // MARK: - Linking API
    
    override func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
        AppsFlyerAttribution.shared().handleOpen(url, options: options)
        return RCTLinkingManager.application(app, open: url, options: options)
    }
    
    // MARK: - Universal Links
    
    override func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        AppsFlyerAttribution.shared().perform(
          #selector(AppsFlyerAttribution.continue(_:restorationHandler:)),
            with: userActivity,
            with: restorationHandler
        )
        return RCTLinkingManager.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
 
  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
