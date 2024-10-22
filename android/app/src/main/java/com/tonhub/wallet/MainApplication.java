package com.tonhub.wallet;

import android.app.Application;
import android.content.Intent;
import android.content.res.Configuration;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import androidx.annotation.NonNull;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import android.content.Context;
import android.os.Bundle;

import com.facebook.react.ReactInstanceManager;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import com.tonhub.wallet.modules.appearance.AppearancePackage;
import com.tonhub.wallet.modules.navbarcolor.NavigationBarColorPackage;
import com.tonhub.wallet.modules.store.KeyStorePackage;

import com.shopify.reactnativeperformance.ReactNativePerformance;
import com.tonhub.wallet.modules.wallet.WalletPackage;

import io.branch.rnbranch.RNBranchModule;

public class MainApplication extends Application implements ReactApplication {
    private final ReactNativeHost mReactNativeHost = new ReactNativeHostWrapper(
            this,
            new ReactNativeHostWrapper(this, new DefaultReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                @Override
                protected List<ReactPackage> getPackages() {
                    @SuppressWarnings("UnnecessaryLocalVariable")
                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    packages.add(new KeyStorePackage());
                    packages.add(new NavigationBarColorPackage());
                    packages.add(new AppearancePackage());
                    packages.add(new WalletPackage());
                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }
                @Override
                protected boolean isNewArchEnabled() {
                    return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
                }
                @Override
                protected Boolean isHermesEnabled() {
                    return BuildConfig.IS_HERMES_ENABLED;
                }
            }));

//    private final ReactNativeHost mNewArchitectureNativeHost = new MainApplicationReactNativeHost(this);


    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        ReactNativePerformance.onAppStarted();
        RNBranchModule.enableLogging();
        RNBranchModule.getAutoInstance(this);
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            DefaultNewArchitectureEntryPoint.load();
        }
        ApplicationLifecycleDispatcher.onApplicationCreate(this);
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);

        Intent themeStyleIntent = new Intent("THEME_STYLE_UPDATED");
        String style = "light";
        int currentNightMode = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;

        switch (currentNightMode) {
            case Configuration.UI_MODE_NIGHT_NO:
                style = "light";
                break;
            case Configuration.UI_MODE_NIGHT_YES:
                style = "dark";
                break;
        }

        Bundle dataBundle = new Bundle();
        dataBundle.putString("style", style);
        themeStyleIntent.putExtras(dataBundle);

        this.sendBroadcast(themeStyleIntent);
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
                Class<?> aClass = Class.forName("com.tonhub.wallet.ReactNativeFlipper");
                aClass
                        .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                        .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }
}
