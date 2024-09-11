package com.tonhub.wallet.modules.wallet;

public class TokenStatus {
    int status;
    String issuerToken;

    public TokenStatus(int status, String issuerToken) {
        this.status = status;
        this.issuerToken = issuerToken;
    }
}
