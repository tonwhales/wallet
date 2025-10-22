package com.tonhub.wallet

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import com.tonhub.wallet.push.PushNotificationManager
import cloud.mindbox.mobile_sdk.Mindbox

class MainActivity : ReactActivity() {
    private lateinit var mPushNotificationManager: PushNotificationManager

    /**
     * Checks if the intent contains Maestra push notification data
     */
    private fun isMaestraPush(intent: Intent?): Boolean {
        if (intent == null) return false

        val extras = intent.extras ?: return false

        // Check for Maestra-specific fields
        return extras.containsKey("uniq_push_key") && extras.containsKey("push_url")
    }

    /**
     * Processes intent and handles Maestra push tracking for onCreate
     */
    private fun processIntent(intent: Intent?) {
        // Always process notification intent for our push manager
        mPushNotificationManager.processNotificationIntent(intent)

        // Track Maestra push clicks only
        if (isMaestraPush(intent)) {
            Mindbox.onPushClicked(this, intent)
        }
    }

    /**
     * Sanitizes a Bundle by copying only React-supported types.
     * this clears all unsupported types like android.os.UserHandle, Parcelable objects
     * THOSE CAUSE CRASHES when Android is trying to Arguments.fromBundle
     */
    private fun sanitizeBundle(source: Bundle?): Bundle? {
        if (source == null) return null

        val sanitized = Bundle()
        for (key in source.keySet()) {
            val value = source.get(key) ?: continue

            when (value) {
                is Bundle -> sanitized.putBundle(key, sanitizeBundle(value))
                is String -> sanitized.putString(key, value)
                is Boolean -> sanitized.putBoolean(key, value)
                is Int -> sanitized.putInt(key, value)
                is Double -> sanitized.putDouble(key, value)
                is Float -> sanitized.putDouble(key, value.toDouble())
                is Long -> sanitized.putDouble(key, value.toDouble())
                is Array<*> -> {
                    if (value is Array<String>) {
                        @Suppress("UNCHECKED_CAST")
                        sanitized.putStringArray(key, value as Array<String>)
                    }
                }
                is ArrayList<*> -> {
                    when {
                        value.isEmpty() -> sanitized.putStringArrayList(key, ArrayList())
                        value[0] is String -> {
                            @Suppress("UNCHECKED_CAST")
                            sanitized.putStringArrayList(key, value as ArrayList<String>)
                        }
                        value[0] is Bundle -> {
                            val bundles = ArrayList<Bundle>()
                            for (item in value) {
                                if (item is Bundle) {
                                    bundles.add(sanitizeBundle(item) ?: Bundle())
                                }
                            }
                            sanitized.putParcelableArrayList(key, bundles)
                        }
                    }
                }
            }
        }

        return sanitized
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        setTheme(R.style.AppTheme)
        super.onCreate(null)

        // Handle window insets for Android 35+
        if (Build.VERSION.SDK_INT >= 35) {
            val rootView = findViewById<View>(android.R.id.content)
            ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
                val innerPadding = insets.getInsets(WindowInsetsCompat.Type.ime())
                rootView.setPadding(
                    innerPadding.left,
                    innerPadding.top,
                    innerPadding.right,
                    innerPadding.bottom
                )
                insets
            }
        }

        mPushNotificationManager = PushNotificationManager.getInstance(application as ReactApplication)
        processIntent(intent)
    }

    override fun onStart() {
        super.onStart()
        mPushNotificationManager.onStart()
    }

    override fun onResume() {
        super.onResume()
        mPushNotificationManager.onResume()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)

        // Track Maestra push clicks only
        if (isMaestraPush(intent)) {
            Mindbox.onPushClicked(this, intent)
        }

        mPushNotificationManager.onNewIntent(intent)
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    override fun getMainComponentName(): String = "main"

    /**
     * Align the back button behavior with Android S
     * where moving root activities to background instead of finishing activities.
     *
     * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
     */
    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                // For non-root activities, use the default implementation to finish them.
                super.invokeDefaultOnBackPressed()
            }
            return
        }

        // Use the default back button implementation on Android S
        // because it's doing more than {@link Activity#moveTaskToBack} in fact.
        super.invokeDefaultOnBackPressed()
    }

    /**
     * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
     * you can specify the rendered you wish to use (Fabric or the older renderer).
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                // If you opted-in for the New Architecture, we enable the Fabric Renderer.
                DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
                // If you opted-in for the New Architecture, we enable Concurrent React (i.e.
                // React 18).
                DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
            ) {
                override fun getLaunchOptions(): Bundle? {
                    val intent = intent
                    var initBundle = super.getLaunchOptions()

                    // Pass initial push notification data for cold start
                    val extras = intent.extras
                    if (extras != null && extras.size() > 0) {
                        if (initBundle == null) {
                            initBundle = Bundle()
                        }
                        initBundle.putBundle("initialPushData", sanitizeBundle(extras))
                    }

                    return initBundle
                }
            }
        )
    }
}

