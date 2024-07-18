//
//  AddCardRequestHandler.m
//  WhalesApp
//
//  Created by VZ on 17/7/24.
//

#import "AddCardRequestHandler.h"

@implementation AddCardRequestHandler

- (instancetype)initWithResolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject
                          cardId:(NSString *)cardId
                       userToken:(NSString *)userToken
                          isTest:(BOOL *)isTest {
  self = [super init];
  if (self) {
    _cardId = cardId;
    _userToken = userToken;
    _resolver = resolve;
    _rejecter = reject;
    _isTest = isTest;
  }
  return self;
}

@end
