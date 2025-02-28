package com.tonhub.wallet.modules.webview;

import android.webkit.CookieManager;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class WebViewCacheModule extends ReactContextBaseJavaModule {
    WebViewCacheModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "WebViewCacheModule";
    }

    @ReactMethod
    public void clearCache() {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                WebView webView = new WebView(getReactApplicationContext());
                webView.clearCache(true);
                CookieManager.getInstance().removeAllCookies(null);
                WebStorage.getInstance().deleteAllData();
            }
        });
    }
}