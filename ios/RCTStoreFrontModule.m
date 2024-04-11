// RCTStoreFrontModule.m
#import "RCTStoreFrontModule.h"
#import <StoreKit/StoreKit.h>

@implementation RCTStoreFrontModule

// To export a module named RCTStoreFrontModule
RCT_EXPORT_MODULE(StoreFront);

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSDictionary *)constantsToExport
{
    if (@available(iOS 13.0, *)) {
        SKStorefront* skStoreFront = [SKPaymentQueue defaultQueue].storefront;
        if(skStoreFront != nil)
            return @{ @"countryCode": skStoreFront.countryCode };
        else
            return @{ @"countryCode": [NSNull null] };
    } else {
        return @{ @"countryCode": [NSNull null] };
    }
}

@end
