package com.tonhub.wallet.modules.webview

import android.os.Handler
import android.os.Looper
import android.webkit.CookieManager
import android.webkit.WebStorage
import android.webkit.WebView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WebViewCacheModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    override fun getName(): String {
        return "WebViewCacheModule"
    }

    @ReactMethod
    fun clearCache() {
        Handler(Looper.getMainLooper()).post {
            val webView = WebView(reactApplicationContext)
            webView.clearCache(true)
            CookieManager.getInstance().removeAllCookies(null)
            WebStorage.getInstance().deleteAllData()
        }
    }
}


