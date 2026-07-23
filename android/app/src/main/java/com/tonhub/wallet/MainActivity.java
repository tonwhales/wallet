package com.tonhub.wallet;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactApplication;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import expo.modules.ReactActivityDelegateWrapper;
import com.tonhub.wallet.push.PushNotificationManager;
import cloud.mindbox.mobile_sdk.Mindbox;
import java.util.ArrayList;

public class MainActivity extends ReactActivity {
    private PushNotificationManager mPushNotificationManager;

    /**
     * Checks if the intent contains Maestra push notification data
     */
    private boolean isMaestraPush(Intent intent) {
        if (intent == null)
            return false;

        Bundle extras = intent.getExtras();
        if (extras == null)
            return false;

        // Check for Maestra-specific fields
        return extras.containsKey("uniq_push_key") && extras.containsKey("push_url");
    }

    /**
     * Processes intent and handles Maestra push tracking for onCreate
     */
    private void processIntent(Intent intent) {
        // Always process notification intent for our push manager
        mPushNotificationManager.processNotificationIntent(intent);

        // Track Maestra push clicks only
        if (isMaestraPush(intent)) {
            Mindbox.INSTANCE.onPushClicked(this, intent);
        }
    }

    /**
     * Sanitizes a Bundle by copying only React-supported types.
     * this clears all unsupported types like android.os.UserHandle, Parcelable objects
     * THOSE CUASE CRASHES when Android is trying to Arguments.fromBundle
     */
    private Bundle sanitizeBundle(Bundle source) {
        if (source == null) return null;

        Bundle sanitized = new Bundle();
        for (String key : source.keySet()) {
            Object value = source.get(key);
            if (value == null) {
                continue;
            }

            if (value instanceof Bundle) {
                sanitized.putBundle(key, sanitizeBundle((Bundle) value));
            } else if (value instanceof String) {
                sanitized.putString(key, (String) value);
            } else if (value instanceof Boolean) {
                sanitized.putBoolean(key, (Boolean) value);
            } else if (value instanceof Integer) {
                sanitized.putInt(key, (Integer) value);
            } else if (value instanceof Double) {
                sanitized.putDouble(key, (Double) value);
            } else if (value instanceof Float) {
                sanitized.putDouble(key, ((Float) value).doubleValue());
            } else if (value instanceof Long) {
                sanitized.putDouble(key, ((Long) value).doubleValue());
            } else if (value instanceof String[]) {
                sanitized.putStringArray(key, (String[]) value);
            } else if (value instanceof ArrayList) {
                ArrayList<?> list = (ArrayList<?>) value;
                if (list.isEmpty()) {
                    sanitized.putStringArrayList(key, new ArrayList<>());
                } else {
                    Object first = list.get(0);
                    if (first instanceof String) {
                        //noinspection unchecked
                        sanitized.putStringArrayList(key, (ArrayList<String>) list);
                    } else if (first instanceof Bundle) {
                        ArrayList<Bundle> bundles = new ArrayList<>();
                        for (Object item : list) {
                            if (item instanceof Bundle) {
                                bundles.add(sanitizeBundle((Bundle) item));
                            }
                        }
                        sanitized.putParcelableArrayList(key, bundles);
                    }
                }
            }
        }

        return sanitized;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        setTheme(R.style.AppTheme);
        super.onCreate(null);

        // Handle window insets for Android 35+
        if (Build.VERSION.SDK_INT >= 35) {
            View rootView = findViewById(android.R.id.content);
            ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
                Insets innerPadding = insets.getInsets(WindowInsetsCompat.Type.ime());
                rootView.setPadding(
                    innerPadding.left,
                    innerPadding.top,
                    innerPadding.right,
                    innerPadding.bottom
                );
                return insets;
            });
        }

        mPushNotificationManager = PushNotificationManager.getInstance((ReactApplication) getApplication());
        processIntent(getIntent());
    }

    @Override
    protected void onStart() {
        super.onStart();
        mPushNotificationManager.onStart();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mPushNotificationManager.onResume();
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // Track Maestra push clicks only
        if (isMaestraPush(intent)) {
            Mindbox.INSTANCE.onPushClicked(this, intent);
        }

        mPushNotificationManager.onNewIntent(intent);
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "main";
    }

    /**
     * Align the back button behavior with Android S
     * where moving root activities to background instead of finishing activities.
     *
     * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                // For non-root activities, use the default implementation to finish them.
                super.invokeDefaultOnBackPressed();
            }
            return;
        }

        // Use the default back button implementation on Android S
        // because it's doing more than {@link Activity#moveTaskToBack} in fact.
        super.invokeDefaultOnBackPressed();
    }

    /**
     * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
     * you can specify the rendered you wish to use (Fabric or the older renderer).
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
                new DefaultReactActivityDelegate(
                        this,
                        getMainComponentName(),
                        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
                        DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
                        // If you opted-in for the New Architecture, we enable Concurrent React (i.e.
                        // React 18).
                        DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
                ) {
                    @Nullable
                    @Override
                    protected Bundle getLaunchOptions() {
                        Intent intent = getIntent();
                        Bundle initBundle = super.getLaunchOptions();

                        // Pass initial push notification data for cold start
                        Bundle extras = intent.getExtras();
                        if (extras != null && extras.size() > 0) {
                            if (initBundle == null) {
                                initBundle = new Bundle();
                            }
                            initBundle.putBundle("initialPushData", sanitizeBundle(extras));
                        }

                        return initBundle;
                    }
                });
    }
}
