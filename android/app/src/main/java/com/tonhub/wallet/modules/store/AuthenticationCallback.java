package com.tonhub.wallet.modules.store;

import com.facebook.react.bridge.Promise;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

// Interface used to pass the authentication logic
public interface AuthenticationCallback {
    void checkAuthentication(
            Promise promise,
            Cipher cipher,
            EncryptionCallback encryptionCallback,
            PostEncryptionCallback postEncryptionCallback
    );

    void checkAuthNoCipher(
            Promise promise,
            Cipher cipher,
            EncryptionCallback encryptionCallback,
            PostEncryptionCallback postEncryptionCallback,
            SecretKey secretKey
    );
}

