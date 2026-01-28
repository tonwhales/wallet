package com.tonhub.wallet

import android.app.Application
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.tonhub.wallet.modules.appearance.AppearancePackage
import com.tonhub.wallet.modules.navbarcolor.NavigationBarColorPackage
import com.tonhub.wallet.modules.store.KeyStorePackage
import com.tonhub.wallet.modules.webview.WebViewCachePackage
import com.tonhub.wallet.modules.flagsecure.FlagSecurePackage
import com.tonhub.wallet.modules.wallet.WalletPackage
import com.intercom.reactnative.IntercomModule
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override fun getPackages(): List<ReactPackage> {
                val packages = PackageList(this).packages.toMutableList()
                packages.add(KeyStorePackage())
                packages.add(NavigationBarColorPackage())
                packages.add(AppearancePackage())
                packages.add(WebViewCachePackage())
                packages.add(FlagSecurePackage())
                packages.add(WalletPackage())
                return packages
            }

            override fun getJSMainModuleName(): String = "index"

            override val isNewArchEnabled: Boolean
                get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

            override val isHermesEnabled: Boolean
                get() = BuildConfig.IS_HERMES_ENABLED
        }
    )

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)

        IntercomModule.initialize(this, BuildConfig.INTERCOM_ANDROID_API, BuildConfig.INTERCOM_APP)

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            DefaultNewArchitectureEntryPoint.load()
        }
        ApplicationLifecycleDispatcher.onApplicationCreate(this)

        // Initialize Mindbox push services
        val pushServices = mutableListOf<cloud.mindbox.mobile_sdk.pushes.MindboxPushService>()
        MindboxFirebase?.let { pushServices.add(it) }
        Mindbox.initPushServices(this, pushServices)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)

        val themeStyleIntent = Intent("THEME_STYLE_UPDATED")
        val style = when (newConfig.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
            Configuration.UI_MODE_NIGHT_NO -> "light"
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            else -> "light"
        }

        val dataBundle = Bundle()
        dataBundle.putString("style", style)
        themeStyleIntent.putExtras(dataBundle)

        sendBroadcast(themeStyleIntent)
    }
}
