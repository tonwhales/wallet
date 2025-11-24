package com.tonhub.wallet.modules.wallet

import java.util.concurrent.CompletableFuture

data class ProvisionRequest(
    val isTestnet: Boolean,
    val token: String,
    val cardId: String,
    val displayName: String,
    val lastDigits: String,
    val completableFuture: CompletableFuture<Boolean>
)


