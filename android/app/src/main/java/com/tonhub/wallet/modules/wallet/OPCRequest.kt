package com.tonhub.wallet.modules.wallet

import java.util.concurrent.CompletableFuture

data class OPCRequest(
    val cardId: String,
    val token: String,
    val walletId: String,
    val stableHardwareId: String,
    val isTestnet: Boolean,
    val future: CompletableFuture<String>
)


