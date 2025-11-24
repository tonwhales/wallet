package com.tonhub.wallet.modules.store

import java.security.GeneralSecurityException

interface PostAuthCallback {
    @Throws(GeneralSecurityException::class)
    fun run(success: Boolean)
}


