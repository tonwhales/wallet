package com.tonhub.wallet.push;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.tonhub.wallet.MainActivity;
import com.tonhub.wallet.R;

import java.util.Map;
import java.util.Random;

/**
 * Service for handling FCM messages for Expo notifications. Foreground state only.
 * This service processes Expo-specific notifications and displays them in the system tray.
 * Non-Expo notifications are passed to other services (e.g., Maestra).
 */
public class ExpoFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "ExpoFCMService";
    private static final String NOTIFICATION_CHANNEL_ID = "expo-notifications";
    private static final String NOTIFICATION_CHANNEL_NAME = "Expo Notifications";
    private static final String NOTIFICATION_CHANNEL_DESCRIPTION = "Notifications from Expo";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        // Guard against null context (can happen in wrapped service scenario)
        if (getApplicationContext() == null) {
            return;
        }
        
        Map<String, String> data = remoteMessage.getData();
        
        // Check if this is an Expo notification
        if (isExpoNotification(data)) {
            // Show notification in system tray for all Expo notifications
            showExpoNotification(remoteMessage);
        } else {
            // Pass non-Expo notifications to other services (e.g., Maestra)
            super.onMessageReceived(remoteMessage);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
    }

    /**
     * Determines if the notification is from Expo based on data content.
     * @param data The data map from the FCM message.
     * @return True if the notification is identified as an Expo notification.
     */
    private boolean isExpoNotification(Map<String, String> data) {
        return data.containsKey("experienceId") || 
               data.containsKey("experienceUrl") || 
               data.containsKey("expo");
    }
    
    /**
     * Shows notification in the system tray using Expo styling.
     * @param remoteMessage The received FCM message containing notification data.
     */
    private void showExpoNotification(RemoteMessage remoteMessage) {
        // Create notification channel for Android O and above
        createNotificationChannel();
        
        // Get notification content, fallback to default if not provided
        String title = remoteMessage.getNotification() != null && remoteMessage.getNotification().getTitle() != null ? 
                remoteMessage.getNotification().getTitle() : 
                "New Notification";
                
        String body = remoteMessage.getNotification() != null && remoteMessage.getNotification().getBody() != null ? 
                remoteMessage.getNotification().getBody() : 
                "You have a new notification";
                
        // Extract from data if not in notification object
        Map<String, String> data = remoteMessage.getData();
        if (data.containsKey("title")) {
            title = data.get("title");
        }
        if (data.containsKey("message") || data.containsKey("body")) {
            body = data.containsKey("message") ? data.get("message") : data.get("body");
        }
        
        // Create intent for when notification is tapped
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        // Add all data to the intent for processing in the app
        for (Map.Entry<String, String> entry : data.entrySet()) {
            intent.putExtra(entry.getKey(), entry.getValue());
        }
        
        // Use a unique requestCode for PendingIntent to avoid overwriting
        int requestCode = new Random().nextInt(1000000);
        
        // Create pending intent with updated flags
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 
                requestCode, 
                intent, 
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        
        // Get default notification sound
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        
        // Build notification with Expo styling
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(R.drawable.vector_notification)  // Use app's notification icon
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)  // Dismiss on tap
                .setSound(defaultSoundUri)
                .setContentIntent(pendingIntent);
        
        // Show notification
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(requestCode, notificationBuilder.build());
        }
    }
    
    /**
     * Creates a notification channel for Android О and above.
     */
    private void createNotificationChannel() {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription(NOTIFICATION_CHANNEL_DESCRIPTION);
        notificationManager.createNotificationChannel(channel);
    }
} 