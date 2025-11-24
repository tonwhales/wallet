package com.tonhub.wallet.modules.flagsecure

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FlagSecureModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "FlagSecureModule"
    }

    @ReactMethod
    fun activate() {
        val activity = currentActivity

        activity?.runOnUiThread {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    @ReactMethod
    fun deactivate() {
        val activity = currentActivity

        activity?.runOnUiThread {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}


