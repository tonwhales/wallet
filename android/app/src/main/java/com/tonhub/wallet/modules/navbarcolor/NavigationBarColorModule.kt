package com.tonhub.wallet.modules.navbarcolor

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.uimanager.IllegalViewOperationException

class NavigationBarColorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val REACT_CLASS = "NavBarColor"
        private const val ERROR_NO_ACTIVITY = "NO_ACTIVITY_ERROR"
        private const val ERROR_NO_ACTIVITY_MESSAGE = "Not attached to an Activity"
        private const val ERROR_API_LEVEL = "API_LEVEl"
        private const val ERROR_API_LEVEL_MESSAGE = "Only Android Oreo and above is supported"
        private val UI_FLAG_HIDE_NAV_BAR = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
    }

    private fun setNavigationBarTheme(activity: Activity?, light: Boolean) {
        if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val window = activity.window
            var flags = window.decorView.systemUiVisibility
            flags = if (light) {
                flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            } else {
                flags and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
            }
            window.decorView.systemUiVisibility = flags
        }
    }

    override fun getName(): String {
        return REACT_CLASS
    }

    override fun getConstants(): Map<String, Any> {
        return mapOf("EXAMPLE_CONSTANT" to "example")
    }

    @ReactMethod
    fun changeNavigationBarColor(color: String, light: Boolean, animated: Boolean, promise: Promise) {
        val map = Arguments.createMap()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val activity = currentActivity
            if (activity != null) {
                try {
                    val window = activity.window
                    runOnUiThread {
                        if (color == "transparent" || color == "translucent") {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
                            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
                            if (color == "transparent") {
                                window.setFlags(
                                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                                )
                            } else {
                                window.setFlags(
                                    WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION,
                                    WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
                                )
                            }
                            setNavigationBarTheme(activity, light)
                            map.putBoolean("success", true)
                            promise.resolve(map)
                            return@runOnUiThread
                        } else {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
                            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
                        }
                        if (animated) {
                            val colorFrom = window.navigationBarColor
                            val colorTo = Color.parseColor(color)
                            val colorAnimation = ValueAnimator.ofObject(ArgbEvaluator(), colorFrom, colorTo)
                            colorAnimation.addUpdateListener { animator ->
                                window.navigationBarColor = animator.animatedValue as Int
                            }
                            colorAnimation.start()
                        } else {
                            window.navigationBarColor = Color.parseColor(color)
                        }
                        setNavigationBarTheme(activity, light)
                        map.putBoolean("success", true)
                        promise.resolve(map)
                    }
                } catch (e: IllegalViewOperationException) {
                    map.putBoolean("success", false)
                    promise.reject("error", e)
                }
            } else {
                promise.reject(ERROR_NO_ACTIVITY, Throwable(ERROR_NO_ACTIVITY_MESSAGE))
            }
        } else {
            promise.reject(ERROR_API_LEVEL, Throwable(ERROR_API_LEVEL_MESSAGE))
        }
    }

    @ReactMethod
    fun hideNavigationBar(promise: Promise) {
        try {
            runOnUiThread {
                currentActivity?.let { activity ->
                    val decorView = activity.window.decorView
                    decorView.systemUiVisibility = UI_FLAG_HIDE_NAV_BAR
                }
            }
        } catch (e: IllegalViewOperationException) {
            val map = Arguments.createMap()
            map.putBoolean("success", false)
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun showNavigationBar(promise: Promise) {
        try {
            runOnUiThread {
                currentActivity?.let { activity ->
                    val decorView = activity.window.decorView
                    decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
                }
            }
        } catch (e: IllegalViewOperationException) {
            val map = Arguments.createMap()
            map.putBoolean("success", false)
            promise.reject("error", e)
        }
    }
}


