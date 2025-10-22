package com.tonhub.wallet

import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.intercom.reactnative.IntercomModule
import com.shopify.reactnativeperformance.ReactNativePerformance
import com.tonhub.wallet.modules.appearance.AppearancePackage
import com.tonhub.wallet.modules.flagsecure.FlagSecurePackage
import com.tonhub.wallet.modules.navbarcolor.NavigationBarColorPackage
import com.tonhub.wallet.modules.store.KeyStorePackage
import com.tonhub.wallet.modules.wallet.WalletPackage
import com.tonhub.wallet.modules.webview.WebViewCachePackage
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
    private val mReactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        ReactNativeHostWrapper(
            this,
            object : DefaultReactNativeHost(this) {
                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override fun getPackages(): List<ReactPackage> {
                    @Suppress("UnnecessaryVariable")
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

                override fun isNewArchEnabled(): Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

                override fun isHermesEnabled(): Boolean = BuildConfig.IS_HERMES_ENABLED
            }
        )
    )

    override fun getReactNativeHost(): ReactNativeHost = mReactNativeHost

    override fun onCreate() {
        ReactNativePerformance.onAppStarted()
        super.onCreate()
        SoLoader.init(this, /* native exopackage */ false)

        IntercomModule.initialize(this, BuildConfig.INTERCOM_ANDROID_API, BuildConfig.INTERCOM_APP)

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for
            // this app.
            DefaultNewArchitectureEntryPoint.load()
        }
        ApplicationLifecycleDispatcher.onApplicationCreate(this)

        // @TODO: uncomment this when we start using Maestra
        // val pushServices = mutableListOf<cloud.mindbox.mobile_sdk.pushes.MindboxPushService>()
        
        // if (MindboxFirebase != null) {
        //     pushServices.add(MindboxFirebase)
        // }
        
        // Mindbox.initPushServices(this, pushServices)
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

        this.sendBroadcast(themeStyleIntent)
    }

    companion object {
        /**
         * Loads Flipper in React Native templates. Call this in the onCreate method
         * with something like
         * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
         *
         * @param context
         * @param reactInstanceManager
         */
        private fun initializeFlipper(
            context: Context,
            reactInstanceManager: ReactInstanceManager
        ) {
            if (BuildConfig.DEBUG) {
                try {
                    /*
                     * We use reflection here to pick up the class that initializes Flipper,
                     * since Flipper library is not available in release mode
                     */
                    val aClass = Class.forName("com.tonhub.wallet.ReactNativeFlipper")
                    aClass
                        .getMethod("initializeFlipper", Context::class.java, ReactInstanceManager::class.java)
                        .invoke(null, context, reactInstanceManager)
                } catch (e: ClassNotFoundException) {
                    e.printStackTrace()
                } catch (e: NoSuchMethodException) {
                    e.printStackTrace()
                } catch (e: IllegalAccessException) {
                    e.printStackTrace()
                } catch (e: java.lang.reflect.InvocationTargetException) {
                    e.printStackTrace()
                }
            }
        }
    }
}




