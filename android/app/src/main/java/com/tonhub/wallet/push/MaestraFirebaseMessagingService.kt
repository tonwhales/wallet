package com.tonhub.wallet.push

import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.tonhub.wallet.MainActivity
import com.tonhub.wallet.R

class MaestraFirebaseMessagingService : FirebaseMessagingService() {
    companion object {
        private const val NOTIFICATION_CHANNEL_ID = "maestra-notifications"
        private const val NOTIFICATION_CHANNEL_NAME = "Maestra Notifications"
        private const val NOTIFICATION_CHANNEL_DESCRIPTION = "Notifications from Maestra"
    }
    
    override fun onNewToken(token: String) {
        Mindbox.updatePushToken(applicationContext, token, MindboxFirebase)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val channelId = NOTIFICATION_CHANNEL_ID
        val channelName = NOTIFICATION_CHANNEL_NAME
        val channelDescription = NOTIFICATION_CHANNEL_DESCRIPTION
        val pushSmallIcon = R.drawable.vector_notification
        
        // Handle remote message with Mindbox SDK
        Mindbox.handleRemoteMessage(
            context = applicationContext,
            message = remoteMessage,
            activities = mapOf(),
            channelId = channelId,
            channelName = channelName,
            pushSmallIcon = pushSmallIcon,
            defaultActivity = MainActivity::class.java,
            channelDescription = channelDescription
        )
    }
} 