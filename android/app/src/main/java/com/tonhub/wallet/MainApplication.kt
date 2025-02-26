package com.tonhub.wallet

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.tonhub.wallet.modules.appearance.AppearancePackage
import com.tonhub.wallet.modules.navbarcolor.NavigationBarColorPackage
import com.tonhub.wallet.modules.store.KeyStorePackage
import com.tonhub.wallet.modules.wallet.WalletPackage
import android.content.res.Configuration
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(
            this,
            object : DefaultReactNativeHost(this) {
                override fun getPackages(): List<ReactPackage> {
                    val packages = PackageList(this).packages
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // packages.add(new MyReactNativePackage());
                    packages.add(KeyStorePackage())
                    packages.add(NavigationBarColorPackage())
                    packages.add(AppearancePackage())

                    try {
                        Class.forName("com.google.android.gms.tapandpay.TapAndPay")
                        packages.add(WalletPackage())
                    } catch (e: ClassNotFoundException) {
                        // tapandpay_sdk was not added: skip WalletPackage
                    }
                    
                    return packages
                }

                override fun getJSMainModuleName(): String = "index"

                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
            }
        )

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
            ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}