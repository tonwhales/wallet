package com.tonhub.wallet.modules.store

import com.facebook.react.bridge.Promise
import javax.crypto.Cipher

// Interface used to pass the authentication logic
interface AuthenticationCallback {
    fun checkAuthentication(
        promise: Promise,
        cipher: Cipher,
        encryptionCallback: EncryptionCallback,
        postEncryptionCallback: PostEncryptionCallback
    )

    fun checkAuthNoCipher(
        promise: Promise,
        postAuthCallback: PostAuthCallback
    )
}


