import WonderPushExtension
import Foundation

class NotificationService: WPNotificationServiceExtension {

    override class func clientId() -> String {
        return Bundle.main.object(forInfoDictionaryKey: "WONDERPUSH_CLIENT_ID") as? String ?? ""
    }

    override class func clientSecret() -> String {
        return Bundle.main.object(forInfoDictionaryKey: "WONDERPUSH_CLIENT_SECRET") as? String ?? ""
    }

}
