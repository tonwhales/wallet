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
                           token:(NSString *)token
                         network:(NSString *)network {
  self = [super init];
  if (self) {
    _cardId = cardId;
    _token = token;
    _resolver = resolve;
    _rejecter = reject;
    _network = network;
  }
  return self;
}

@end
