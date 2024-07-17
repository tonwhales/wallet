//
//  AddCardRequestHandler.m
//  WhalesApp
//
//  Created by VZ on 17/7/24.
//

#import "AddCardRequestHandler.h"

@implementation AddCardRequestHandler

- (instancetype)initWithResolver:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter userToken:(NSString *)userToken cardId:(NSString *)cardId {
  self = [super init];
  if (self) {
    _cardId = cardId;
    _userToken = userToken;
    _resolver = resolver;
    _rejecter = rejecter;
  }
  return self;
}

@end
