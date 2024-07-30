//
//  AddCardRequestHandler.h
//  WhalesApp
//
//  Created by VZ on 17/7/24.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface AddCardRequestHandler : NSObject

@property (nonatomic, copy) RCTPromiseResolveBlock resolver;
@property (nonatomic, copy) RCTPromiseRejectBlock rejecter;
@property (nonatomic, copy) NSString* token;
@property (nonatomic, copy) NSString* cardId;
@property (nonatomic, copy) NSString* network;

- (instancetype)initWithResolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject
                          cardId:(NSString *)cardId
                           token:(NSString *)token
                         network:(NSString *)network;

@end
