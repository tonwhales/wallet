package com.tonhub.wallet.modules.appearance

import android.content.Context
import android.content.res.Configuration
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppearanceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var lastKnownTheme: String? = null

    companion object {
        private const val APPEARANCE_CHANGED_EVENT_NAME = "appearanceStyleChanged"
    }

    private fun colorSchemeForCurrentConfiguration(context: Context): String {
        val currentNightMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        return when (currentNightMode) {
            Configuration.UI_MODE_NIGHT_NO -> "light"
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            else -> "light"
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getColorScheme(): String {
        val rnAppContext = reactApplicationContext
        return colorSchemeForCurrentConfiguration(rnAppContext)
    }

    @ReactMethod
    fun forceThemeUpdate() {
        try {
            val rnAppContext = reactApplicationContext
            val currentScheme = colorSchemeForCurrentConfiguration(rnAppContext)
            
            // Emit the current theme to ensure UI is in sync
            rnAppContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(APPEARANCE_CHANGED_EVENT_NAME, currentScheme)
        } catch (e: Exception) {
            // Silent error handling
        }
    }

    @ReactMethod
    fun checkThemeChange() {
        try {
            val rnAppContext = reactApplicationContext
            val currentTheme = colorSchemeForCurrentConfiguration(rnAppContext)
            
            if (lastKnownTheme == null || lastKnownTheme != currentTheme) {
                lastKnownTheme = currentTheme
                
                // Emit theme change event
                rnAppContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(APPEARANCE_CHANGED_EVENT_NAME, currentTheme)
            }
        } catch (e: Exception) {
            // Silent error handling
        }
    }

    override fun getName(): String {
        return "AppearanceModule"
    }

    override fun initialize() {
        super.initialize()
        // Initialize with current theme
        try {
            val rnAppContext = reactApplicationContext
            lastKnownTheme = colorSchemeForCurrentConfiguration(rnAppContext)
        } catch (e: Exception) {
            // Silent error handling
        }
    }
}


