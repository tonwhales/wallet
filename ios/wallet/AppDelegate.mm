#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <ReactNativePerformance/ReactNativePerformance.h>
#import <RNAppsFlyer.h>
#import <IntercomModule.h>
@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [ReactNativePerformance onAppStarted];
  NSString *apiKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"INTERCOM_IOS_API"];
  NSString *appId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"INTERCOM_APP"];
  [IntercomModule initialize:apiKey withAppId:appId]; // <-- Add this (Remember to replace strings with your api keys)

  // Disable iCloud backup
  NSArray *urlArray = [[NSFileManager defaultManager] URLsForDirectory: NSDocumentDirectory inDomains: NSUserDomainMask];
  NSURL *documentsUrl = [urlArray firstObject];
  NSError *error = nil;
  BOOL success = [documentsUrl setResourceValue: [NSNumber numberWithBool: YES]
                                         forKey: NSURLIsExcludedFromBackupKey error: &error];
  if(!success) {
    NSLog(@"Error in disabling %@ from backup %@", [documentsUrl lastPathComponent], error);
  } else {
    NSLog(@"Documents directory backup disabled");
  }
  
  self.moduleName = @"main";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  [UIDevice currentDevice].batteryMonitoringEnabled = true;
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
 }

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
 #ifdef DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
 #else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
 #endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  // If you'd like to export some custom RCTBridgeModules, add them here!
  return @[];
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  [[AppsFlyerAttribution shared] handleOpenUrl:url options:options];
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  [[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end
