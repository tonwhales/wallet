package com.tonhub.wallet.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.tonhub.wallet.MainActivity
import com.tonhub.wallet.R
import kotlin.random.Random

/**
 * Service for handling FCM messages for Expo notifications. Foreground state only.
 * This service processes Expo-specific notifications and displays them in the system tray.
 * Non-Expo notifications are passed to other services (e.g., WonderPush).
 */
class ExpoFirebaseMessagingService : FirebaseMessagingService() {
    companion object {
        private const val NOTIFICATION_CHANNEL_ID = "expo-notifications"
        private const val NOTIFICATION_CHANNEL_NAME = "Expo Notifications"
        private const val NOTIFICATION_CHANNEL_DESCRIPTION = "Notifications from Expo"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Guard against null context (can happen in wrapped service scenario)
        if (applicationContext == null) {
            return
        }
        
        val data = remoteMessage.data
        
        // Check if this is an Expo notification
        if (isExpoNotification(data)) {
            // Show notification in system tray for all Expo notifications
            showExpoNotification(remoteMessage)
        } else {
            // Pass non-Expo notifications to other services (e.g., WonderPush)
            super.onMessageReceived(remoteMessage)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
    }

    /**
     * Determines if the notification is from Expo based on data content.
     * @param data The data map from the FCM message.
     * @return True if the notification is identified as an Expo notification.
     */
    private fun isExpoNotification(data: Map<String, String>): Boolean {
        return data.containsKey("experienceId") || 
               data.containsKey("experienceUrl") || 
               data.containsKey("expo")
    }
    
    /**
     * Shows notification in the system tray using Expo styling.
     * @param remoteMessage The received FCM message containing notification data.
     */
    private fun showExpoNotification(remoteMessage: RemoteMessage) {
        // Create notification channel for Android O and above
        createNotificationChannel()
        
        // Get notification content, fallback to default if not provided
        var title = remoteMessage.notification?.title ?: "New Notification"
        var body = remoteMessage.notification?.body ?: "You have a new notification"
                
        // Extract from data if not in notification object
        val data = remoteMessage.data
        if (data.containsKey("title")) {
            title = data["title"] ?: title
        }
        if (data.containsKey("message") || data.containsKey("body")) {
            body = data["message"] ?: data["body"] ?: body
        }
        
        // Create intent for when notification is tapped
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            // Add all data to the intent for processing in the app
            for ((key, value) in data) {
                putExtra(key, value)
            }
        }
        
        // Use a unique requestCode for PendingIntent to avoid overwriting
        val requestCode = Random.nextInt(1000000)
        
        // Create pending intent with updated flags
        val pendingIntent = PendingIntent.getActivity(
            this, 
            requestCode, 
            intent, 
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        // Get default notification sound
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        // Build notification with Expo styling
        val notificationBuilder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.vector_notification)  // Use app's notification icon
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)  // Dismiss on tap
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
        
        // Show notification
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        notificationManager?.notify(requestCode, notificationBuilder.build())
    }
    
    /**
     * Creates a notification channel for Android O and above.
     */
    private fun createNotificationChannel() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            NOTIFICATION_CHANNEL_NAME,
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = NOTIFICATION_CHANNEL_DESCRIPTION
        }
        notificationManager.createNotificationChannel(channel)
    }
}

