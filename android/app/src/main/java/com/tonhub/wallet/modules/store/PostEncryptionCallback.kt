package com.tonhub.wallet.modules.store

import com.facebook.react.bridge.Promise
import org.json.JSONException
import java.security.GeneralSecurityException

interface PostEncryptionCallback {
    @Throws(JSONException::class, GeneralSecurityException::class)
    fun run(promise: Promise, result: Any?)
}


