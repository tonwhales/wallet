package com.tonhub.wallet.push

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Manager for handling push notifications
 */
class PushNotificationManager private constructor(
    private val mReactApplication: ReactApplication
) {
    companion object {
        private const val TAG = "PushNotificationMgr"
        private var lastPushData: Bundle? = null
        private var waitingToEmitEvent = false
        private var isFirstLaunch = true
        private var instance: PushNotificationManager? = null

        @Synchronized
        fun getInstance(reactApplication: ReactApplication): PushNotificationManager {
            if (instance == null) {
                instance = PushNotificationManager(reactApplication)
            }
            return instance!!
        }
    }

    /**
     * Processes the push notification intent
     */
    fun processNotificationIntent(intent: Intent?) {
        if (intent == null) return

        val extras = intent.extras
        if (extras != null) {
            lastPushData = Bundle(extras)
        }
    }

    /**
     * Called on activity onStart, tracks the first launch of the app
     */
    fun onStart() {
        if (!isFirstLaunch) {
            emitNotificationDataIfNeeded()
        }
        isFirstLaunch = false
    }

    /**
     * Called on activity onResume
     */
    fun onResume() {
        if (!isFirstLaunch) {
            emitNotificationDataIfNeeded()
        }
    }

    /**
     * Processes new intents that may contain push notification data
     */
    fun onNewIntent(intent: Intent?) {
        processNotificationIntent(intent)
        emitNotificationDataIfNeeded()
    }

    /**
     * Sends data to JavaScript if needed
     */
    private fun emitNotificationDataIfNeeded() {
        val data = lastPushData ?: return

        try {
            val reactInstanceManager = mReactApplication.reactNativeHost.reactInstanceManager
            val reactContext = reactInstanceManager.currentReactContext

            if (reactContext != null) {
                sendDataToJS(reactContext, data)
                lastPushData = null
                waitingToEmitEvent = false
            } else {
                waitingToEmitEvent = true
                reactInstanceManager.addReactInstanceEventListener(object :
                    ReactInstanceManager.ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: ReactContext) {
                        lastPushData?.let { sendDataToJS(context, it) }
                        lastPushData = null
                        waitingToEmitEvent = false
                        reactInstanceManager.removeReactInstanceEventListener(this)
                    }
                })
            }
        } catch (e: Exception) {
            if (!waitingToEmitEvent) {
                waitingToEmitEvent = true
                Handler(Looper.getMainLooper()).postDelayed({
                    waitingToEmitEvent = false
                    emitNotificationDataIfNeeded()
                }, 1000)
            }
        }
    }

    /**
     * Sends data to JavaScript
     */
    private fun sendDataToJS(reactContext: ReactContext, data: Bundle) {
        try {
            val params = Arguments.createMap()
            bundleToWritableMap(data, params)
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("pushNotificationOpened", params)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending notification data to JS: ", e)
        }
    }

    /**
     * Converts Bundle to WritableMap for passing to JS
     */
    private fun bundleToWritableMap(bundle: Bundle, map: WritableMap) {
        for (key in bundle.keySet()) {
            when (val value = bundle.get(key)) {
                null -> map.putNull(key)
                is String -> map.putString(key, value)
                is Int -> map.putInt(key, value)
                is Boolean -> map.putBoolean(key, value)
                is Double -> map.putDouble(key, value)
                else -> map.putString(key, value.toString())
            }
        }
    }
}

