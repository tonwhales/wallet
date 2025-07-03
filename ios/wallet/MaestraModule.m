#import "MaestraModule.h"
@import Mindbox;
@import MindboxSdk;

@implementation MaestraModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(updateAPNSToken:(NSString *)tokenString) {
    NSMutableData *data = [[NSMutableData alloc] init];
    unsigned char whole_byte;
    char byte_chars[3] = {'\0','\0','\0'};
    for (int i = 0; i < ([tokenString length] / 2); i++) {
        byte_chars[0] = [tokenString characterAtIndex:i*2];
        byte_chars[1] = [tokenString characterAtIndex:i*2+1];
        whole_byte = strtol(byte_chars, NULL, 16);
        [data appendBytes:&whole_byte length:1];
    }
    [[Mindbox shared] apnsTokenUpdateWithDeviceToken:data];
}

RCT_EXPORT_METHOD(updateNotificationPermissions:(BOOL)granted) {
    [[Mindbox shared] notificationsRequestAuthorizationWithGranted:granted];
}

RCT_EXPORT_METHOD(trackPushClick:(NSDictionary *)notificationData actionIdentifier:(NSString * _Nullable)actionIdentifier) {
    NSString *uniqueKey = notificationData[@"uniqueKey"] ?: notificationData[@"uniq_push_key"];
    
    if (uniqueKey) {
        NSString *buttonUniqueKey = nil;
        if (actionIdentifier && ![actionIdentifier isEqualToString:@"com.apple.UNNotificationDefaultActionIdentifier"]) {
            buttonUniqueKey = actionIdentifier;
        }
        
        [[Mindbox shared] pushClickedWithUniqueKey:uniqueKey buttonUniqueKey:buttonUniqueKey];
    }
}

@end 
