package com.tonhub.wallet.modules.store

import com.facebook.react.bridge.Promise
import org.json.JSONException
import java.security.GeneralSecurityException
import javax.crypto.Cipher

interface EncryptionCallback {
    @Throws(GeneralSecurityException::class, JSONException::class)
    fun run(
        promise: Promise,
        cipher: Cipher,
        postEncryptionCallback: PostEncryptionCallback
    ): Any?
}


