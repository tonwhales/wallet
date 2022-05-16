package com.tonhub.wallet.modules.store;

import com.facebook.react.bridge.Promise;

import org.json.JSONException;

import java.security.GeneralSecurityException;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;

public interface EncryptionCallback {
    Object run(
            Promise promise,
            Cipher cipher,
            PostEncryptionCallback postEncryptionCallback
    ) throws GeneralSecurityException, JSONException;
}
