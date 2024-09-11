package com.tonhub.wallet.modules.wallet;

import java.util.concurrent.CompletableFuture;

public class OPCRequest {
    String cardId;
    String token;
    String walletId;
    String stableHardwareId;
    Boolean isTestnet;
    CompletableFuture<String> future;

    public OPCRequest(String cardId, String token, String walletId, String stableHardwareId, Boolean isTestnet, CompletableFuture<String> future) {
        this.cardId = cardId;
        this.token = token;
        this.walletId = walletId;
        this.stableHardwareId = stableHardwareId;
        this.isTestnet = isTestnet;
        this.future = future;
    }
}
