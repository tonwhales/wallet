package com.tonhub.wallet.modules.store;

import com.facebook.react.bridge.Promise;

import org.json.JSONException;

import java.security.GeneralSecurityException;

public interface PostEncryptionCallback {
    void run(Promise promise, Object result) throws JSONException, GeneralSecurityException;
}
