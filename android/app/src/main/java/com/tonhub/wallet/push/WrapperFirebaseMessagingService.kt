package com.tonhub.wallet.push

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import java.lang.reflect.InvocationTargetException
import java.util.concurrent.atomic.AtomicBoolean

/**
 * This class wraps multiple FirebaseMessagingService implementations
 * and makes sure each will be called appropriately.
 */
class WrapperFirebaseMessagingService : FirebaseMessagingService() {
    private val messagingServices: MutableList<FirebaseMessagingService> = mutableListOf()

    init {
        // Add all the FirebaseMessagingServices you need here
        messagingServices.add(MaestraFirebaseMessagingService())
        messagingServices.add(ExpoFirebaseMessagingService())
    }

    //
    // Forward FirebaseMessagingService methods
    //

    override fun onNewToken(token: String) {
        forward { service -> service.onNewToken(token) }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        forward { service -> service.onMessageReceived(remoteMessage) }
    }

    override fun onDeletedMessages() {
        forward { service -> service.onDeletedMessages() }
    }

    //
    // Forward Service methods
    //

    override fun onCreate() {
        forward { service -> service.onCreate() }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        forward { service -> service.onConfigurationChanged(newConfig) }
    }

    override fun onLowMemory() {
        forward { service -> service.onLowMemory() }
    }

    override fun onTrimMemory(level: Int) {
        forward { service -> service.onTrimMemory(level) }
    }

    override fun onUnbind(intent: Intent?): Boolean {
        val rtn = AtomicBoolean(false)
        forward { service ->
            if (service.onUnbind(intent)) {
                rtn.set(true)
            }
        }
        return rtn.get()
    }

    override fun onRebind(intent: Intent?) {
        forward { service -> service.onRebind(intent) }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        forward { service -> service.onTaskRemoved(rootIntent) }
    }

    //
    // Wrapping code
    //

    private fun forward(action: (FirebaseMessagingService) -> Unit) {
        for (service in messagingServices) {
            action(service)
        }
    }

    // Give the context to wrapped services or they won't be able to call getApplicationContext() and the like,
    // and they will hence likely fail.
    override fun attachBaseContext(newBase: Context?) {
        super.attachBaseContext(newBase)

        // Accessing protected method Landroid/app/Service;->attachBaseContext(Landroid/content/Context;)V
        val method = try {
            Service::class.java.getDeclaredMethod("attachBaseContext", Context::class.java)
        } catch (ex: NoSuchMethodException) {
            Log.e(this::class.java.simpleName, "Failed to reflect Service.attachBaseContext", ex)
            return
        }

        val wasAccessible = method.isAccessible
        if (!wasAccessible) method.isAccessible = true

        // Forward attachBaseContext to the wrapped services too
        forward { service ->
            try {
                method.invoke(service, newBase)
            } catch (ex: IllegalAccessException) {
                Log.e(this::class.java.simpleName, "Failed to invoke Service.attachBaseContext for $service", ex)
            } catch (ex: InvocationTargetException) {
                Log.e(this::class.java.simpleName, "Got an error while invoking Service.attachBaseContext for $service", ex)
            }
        }

        if (!wasAccessible) method.isAccessible = false
    }
}
