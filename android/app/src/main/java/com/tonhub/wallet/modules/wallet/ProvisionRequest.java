package com.tonhub.wallet.modules.wallet;

import java.util.concurrent.CompletableFuture;

public class ProvisionRequest {
    public boolean isTestnet;
    public String token;
    public String cardId;
    public CompletableFuture<Boolean> completableFuture;
    public String displayName;
    public String lastDigits;

    public ProvisionRequest(boolean isTestnet, String token, String cardId, String displayName, String lastDigits, CompletableFuture<Boolean> completableFuture) {
        this.isTestnet = isTestnet;
        this.token = token;
        this.displayName = displayName;
        this.lastDigits = lastDigits;
        this.cardId = cardId;
        this.completableFuture = completableFuture;
    }
}
