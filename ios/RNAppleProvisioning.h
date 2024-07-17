//
//  RNAppleProvisioning.h
//  WhalesApp
//
//  Created by VZ on 17/7/24.
//

#import <React/RCTBridgeModule.h>
#import <PassKit/PassKit.h>

@interface RNAppleProvisioning : NSObject<RCTBridgeModule, PKAddPaymentPassViewControllerDelegate>

@end
