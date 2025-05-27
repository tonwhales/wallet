//
//  NotificationService.m
//  WonderPushNotificationServiceExtension
//
//  Created by VZ on 16/4/25.
//

#import "NotificationService.h"

@implementation NotificationService

+ (NSString *)clientId {
    NSString *clientId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"WONDERPUSH_CLIENT_ID"];
    return clientId ?: @"";
}

+ (NSString *)clientSecret {
    NSString *clientSecret = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"WONDERPUSH_CLIENT_SECRET"];
    return clientSecret ?: @"";
}

@end
