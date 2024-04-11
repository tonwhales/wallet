// RCTStoreFrontModule.m
#import "RCTStoreFrontModule.h"
#import <StoreKit/StoreKit.h>

@implementation RCTStoreFrontModule

// To export a module named RCTStoreFrontModule
RCT_EXPORT_MODULE(StoreFront);

RCT_EXPORT_METHOD(getStoreFront:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    if (@available(iOS 13.0, *)) {
        SKStorefront* skStoreFront = [SKPaymentQueue defaultQueue].storefront;
        if(skStoreFront != nil)
            resolve(skStoreFront.countryCode);
        else
            resolve(nil);
    } else {
        resolve(nil);
    }
}

@end
