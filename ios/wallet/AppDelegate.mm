#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <RNAppsFlyer.h>
#import <IntercomModule.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize Intercom
  NSString *apiKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"INTERCOM_IOS_API"];
  NSString *appId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"INTERCOM_APP"];
  if (apiKey && appId) {
    [IntercomModule initialize:apiKey withAppId:appId];
  }

  // Disable iCloud backup
  NSArray *urlArray = [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask];
  NSURL *documentsUrl = [urlArray firstObject];
  NSError *error = nil;
  [documentsUrl setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:&error];
  
  self.moduleName = @"main";
  self.initialProps = @{};

  [UIDevice currentDevice].batteryMonitoringEnabled = YES;
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if ([AppsFlyerAttribution shared]) {
    [[AppsFlyerAttribution shared] handleOpenUrl:url options:options];
  }
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  if ([AppsFlyerAttribution shared]) {
    [[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
  }
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end

