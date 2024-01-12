package com.tonhub.wallet.modules.appearance;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AppearanceModule extends ReactContextBaseJavaModule {
    private static final String APPEARANCE_CHANGED_EVENT_NAME = "appearanceStyleChanged";
    private static final String THEME_STYLE_UPDATED_ACTION = "THEME_STYLE_UPDATED";

    public AppearanceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    private String colorSchemeForCurrentConfiguration(Context context) {
        int currentNightMode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        Log.d("AppearanceModule", "currentNightMode: " + String.valueOf(currentNightMode));
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

    @Override
    public String getName() {
        return "AppearanceModule";
    }

    @Override
    public void initialize() {
        super.initialize();
        ReactApplicationContext rnAppContext = getReactApplicationContext();
        rnAppContext
                .getApplicationContext()
                .registerReceiver(
                        new BroadcastReceiver() {
                            @Override
                            public void onReceive(Context context, Intent intent) {
                                Bundle extras = intent.getExtras();
                                if (extras != null) {
                                    String style = extras.getString("style");
                                    if (style != null) {
                                        rnAppContext
                                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                                .emit(APPEARANCE_CHANGED_EVENT_NAME, style);
                                    }
                                }
                            }
                        },
                        new IntentFilter(THEME_STYLE_UPDATED_ACTION)
                );
    }
}