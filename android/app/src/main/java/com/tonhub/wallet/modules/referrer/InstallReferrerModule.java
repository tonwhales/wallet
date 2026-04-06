package com.tonhub.wallet.modules.referrer;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;

public class InstallReferrerModule extends ReactContextBaseJavaModule {

    InstallReferrerModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "InstallReferrerModule";
    }

    @ReactMethod
    public void getReferrer(final Promise promise) {
        try {
            final InstallReferrerClient client =
                    InstallReferrerClient.newBuilder(getReactApplicationContext()).build();

            client.startConnection(new InstallReferrerStateListener() {
                @Override
                public void onInstallReferrerSetupFinished(int responseCode) {
                    try {
                        if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
                            ReferrerDetails details = client.getInstallReferrer();
                            String referrer = details.getInstallReferrer();
                            long clickTs = details.getReferrerClickTimestampSeconds();
                            long installTs = details.getInstallBeginTimestampSeconds();
                            promise.resolve(
                                "referrer=" + referrer
                                + "\nclick_ts=" + clickTs
                                + "\ninstall_ts=" + installTs
                            );
                        } else {
                            promise.resolve("error_code=" + responseCode);
                        }
                    } catch (Exception e) {
                        promise.resolve("exception=" + e.getMessage());
                    } finally {
                        try { client.endConnection(); } catch (Exception ignored) {}
                    }
                }

                @Override
                public void onInstallReferrerServiceDisconnected() {
                    promise.resolve("disconnected");
                }
            });
        } catch (Exception e) {
            promise.resolve("init_exception=" + e.getMessage());
        }
    }
}
