package com.tonhub.wallet.modules.store;

import com.facebook.react.bridge.Promise;

import java.security.GeneralSecurityException;

public interface PostAuthCallback {
    void run(Boolean success) throws GeneralSecurityException;
}
