// RCTHttpServerModule.m
#import "RCTHttpServerModule.h"
#import <React/RCTLog.h>

@implementation RCTHttpServerModule

// To export a module named HttpServerMdoule
RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(
                  startServer:(NSString *)host
                  port:(NSNumber *)port
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  RCTLogInfo(@"Starting server at %@:%@", host, port);
}

RCT_EXPORT_METHOD(stopServer)
{
  RCTLogInfo(@"Stopping server");
}

@end
