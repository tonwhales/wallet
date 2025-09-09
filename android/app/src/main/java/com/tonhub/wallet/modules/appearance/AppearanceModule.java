package com.tonhub.wallet.modules.appearance;

import android.content.Context;
import android.content.res.Configuration;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AppearanceModule extends ReactContextBaseJavaModule {
    private static final String APPEARANCE_CHANGED_EVENT_NAME = "appearanceStyleChanged";

    public AppearanceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    private String colorSchemeForCurrentConfiguration(Context context) {
        int currentNightMode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        switch (currentNightMode) {
            case Configuration.UI_MODE_NIGHT_NO:
                return "light";
            case Configuration.UI_MODE_NIGHT_YES:
                return "dark";
        }

        return "light";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getColorScheme() {
        ReactApplicationContext rnAppContext = getReactApplicationContext();
        return colorSchemeForCurrentConfiguration(rnAppContext);
    }

    @ReactMethod
    public void forceThemeUpdate() {
        try {
            ReactApplicationContext rnAppContext = getReactApplicationContext();
            String currentScheme = colorSchemeForCurrentConfiguration(rnAppContext);
            
            // Emit the current theme to ensure UI is in sync
            rnAppContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(APPEARANCE_CHANGED_EVENT_NAME, currentScheme);
        } catch (Exception e) {}
    }

    @ReactMethod
    public void checkThemeChange() {
        try {
            ReactApplicationContext rnAppContext = getReactApplicationContext();
            String currentTheme = colorSchemeForCurrentConfiguration(rnAppContext);
            
            if (lastKnownTheme == null || !lastKnownTheme.equals(currentTheme)) {
                lastKnownTheme = currentTheme;
                
                // Emit theme change event
                rnAppContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(APPEARANCE_CHANGED_EVENT_NAME, currentTheme);
            }
        } catch (Exception e) {
            // Silent error handling
        }
    }

    @Override
    public String getName() {
        return "AppearanceModule";
    }

    private String lastKnownTheme = null;

    @Override
    public void initialize() {
        super.initialize();
        // Initialize with current theme
        try {
            ReactApplicationContext rnAppContext = getReactApplicationContext();
            lastKnownTheme = colorSchemeForCurrentConfiguration(rnAppContext);
        } catch (Exception e) {
            // Silent error handling
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
    }
}