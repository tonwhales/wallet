package com.tonhub.wallet.modules.wallet;

import static com.google.android.gms.tapandpay.TapAndPayStatusCodes.TAP_AND_PAY_ATTESTATION_ERROR;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.NfcManager;
import android.nfc.cardemulation.CardEmulation;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tapandpay.TapAndPay;
import com.google.android.gms.tapandpay.TapAndPayClient;
import com.google.android.gms.tapandpay.issuer.IsTokenizedRequest;
import com.google.android.gms.tapandpay.issuer.PushTokenizeRequest;
import com.google.android.gms.tapandpay.issuer.TokenInfo;
import com.google.android.gms.tapandpay.issuer.ViewTokenRequest;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class WalletModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int REQUEST_CODE_TOKENIZE = 1;
    static final int REQUEST_CODE_PUSH_TOKENIZE = 3;
    private static final int SET_DEFAULT_PAYMENTS_REQUEST_CODE = 5;
    private static final int REQUEST_CREATE_WALLET = 4;
    public static final String GOOGLE_PAY_TP_HCE_SERVICE = "com.google.android.gms.tapandpay.hce.service.TpHceService";

    private final TapAndPayClient tapAndPayClient;

    @Nullable
    private ProvisionRequest currentProvisioning;

    @Nullable
    private CompletableFuture<Boolean> isDefaultWalletFuture;
    @Nullable
    private CompletableFuture<Boolean> walletAddFuture;

    public WalletModule(ReactApplicationContext reactContext) {
        super(reactContext);
        tapAndPayClient = TapAndPay.getClient(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "WalletModule";
    }

    private CompletableFuture<Boolean> createWallet() {
        if (walletAddFuture != null) {
            return walletAddFuture;
        }

        Activity currentActivity = getReactApplicationContext().getCurrentActivity();

        if (currentActivity != null) {
            walletAddFuture = new CompletableFuture<>();
            tapAndPayClient.createWallet(currentActivity, REQUEST_CREATE_WALLET);
        }

        return walletAddFuture;
    }

    private CompletableFuture<WritableArray> getTokenInfoList() {
        CompletableFuture<WritableArray> future = new CompletableFuture<>();
        tapAndPayClient.listTokens().addOnCompleteListener(task -> {

            if (task.isSuccessful()) {
                List<TokenInfo> tokenInfoList = task.getResult();
                WritableArray tokenArray = Arguments.createArray();

                for (TokenInfo tokenInfo : tokenInfoList) {
                    WritableMap tokenMap = Arguments.createMap();

                    tokenMap.putString("issuerTokenId", tokenInfo.getIssuerTokenId());
                    tokenMap.putString("dpanLastFour", tokenInfo.getDpanLastFour());
                    tokenMap.putString("fpanLastFour", tokenInfo.getFpanLastFour());
                    tokenMap.putInt("tokenState", tokenInfo.getTokenState());
                    tokenMap.putString("issuerName", tokenInfo.getIssuerName());
                    tokenMap.putString("portfolioName", tokenInfo.getPortfolioName());
                    tokenMap.putBoolean("isDefaultToken", tokenInfo.getIsDefaultToken());

                    tokenArray.pushMap(tokenMap);
                }

                future.complete(tokenArray);
            } else {
                ApiException apiException = (ApiException) task.getException();
                future.completeExceptionally(apiException);
            }
        });

        return future;
    }

    private CompletableFuture<TokenStatus> getTokenStatusByFpanLastFour(String fpanLastFour) {
        CompletableFuture<TokenStatus> future = new CompletableFuture<>();

        getTokenInfoList().thenAccept((res) -> {
            for (int i = 0; i < res.size(); i++) {
                ReadableMap token = res.getMap(i);
                String fpanLastFourToken = token.getString("fpanLastFour");
                if (fpanLastFourToken != null && fpanLastFourToken.equals(fpanLastFour)) {
                    int tokenState = token.getInt("tokenState");
                    String issuerTokenId = token.getString("issuerTokenId");

                    future.complete(new TokenStatus(tokenState, issuerTokenId));
                    return;
                }
            }

            future.complete(new TokenStatus(-1, null));
        }).exceptionally(e -> {
            future.completeExceptionally(e);
            return null;
        });

        return future;
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void listTokens(Promise promise) {
        getTokenInfoList().thenAccept(promise::resolve).exceptionally(e -> {
            promise.reject(e);
            return null;
        });
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void checkIfCardIsAlreadyAdded(String primaryAccountNumberSuffix, Promise promise) {
        IsTokenizedRequest request = new IsTokenizedRequest.Builder().setNetwork(TapAndPay.CARD_NETWORK_VISA).setTokenServiceProvider(TapAndPay.TOKEN_PROVIDER_VISA).setIssuerName("Holders").setIdentifier(primaryAccountNumberSuffix).build();
        tapAndPayClient.isTokenized(request).addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                this.getTokenStatusByFpanLastFour(primaryAccountNumberSuffix).thenAccept((res) -> {
                    if (res.status == -1) {
                        promise.resolve(false);
                        return;
                    }
                    if (res.status != TapAndPay.TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION && res.status != TapAndPay.TOKEN_STATE_FELICA_PENDING_PROVISIONING) {
                        promise.resolve(true);
                    } else {
                        promise.resolve(false);
                    }
                }).exceptionally(e -> {
                    promise.reject(e);
                    return null;
                });
            } else {
                ApiException apiException = (ApiException) task.getException();
                promise.reject(apiException);
            }
        });
    }

    private Boolean isDefaultWallet() {
        NfcManager nfcManager = (NfcManager) getReactApplicationContext().getSystemService(Context.NFC_SERVICE);
        NfcAdapter adapter = nfcManager.getDefaultAdapter();

        if (adapter == null) {
            return false;
        }

        CardEmulation emulation = CardEmulation.getInstance(adapter);

        return emulation.isDefaultServiceForCategory(new ComponentName(GoogleApiAvailability.GOOGLE_PLAY_SERVICES_PACKAGE, GOOGLE_PAY_TP_HCE_SERVICE), CardEmulation.CATEGORY_PAYMENT);
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void getIsDefaultWallet(Promise promise) {
        Boolean isDefault = isDefaultWallet();
        promise.resolve(isDefault);
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void setDefaultWallet(Promise promise) {
        Boolean isDefault = isDefaultWallet();

        if (isDefault) {
            promise.resolve(true);
            return;
        }

        if (isDefaultWalletFuture != null) {
            promise.reject(new Exception("Another set default wallet is in progress"));
            return;
        }

        Intent intent = new Intent(CardEmulation.ACTION_CHANGE_DEFAULT);
        intent.putExtra(CardEmulation.EXTRA_CATEGORY, CardEmulation.CATEGORY_PAYMENT);
        intent.putExtra(CardEmulation.EXTRA_SERVICE_COMPONENT, new ComponentName(GoogleApiAvailability.GOOGLE_PLAY_SERVICES_PACKAGE, GOOGLE_PAY_TP_HCE_SERVICE));
        getReactApplicationContext().startActivityForResult(intent, SET_DEFAULT_PAYMENTS_REQUEST_CODE, null);

        isDefaultWalletFuture = new CompletableFuture<>();

        isDefaultWalletFuture.thenAccept(promise::resolve).exceptionally(e -> {
            promise.reject(e);
            return null;
        });
    }

    private CompletableFuture<String> getActiveWalletId() {
        CompletableFuture<String> future = new CompletableFuture<>();
        tapAndPayClient.getActiveWalletId().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                future.complete(task.getResult());
            } else {
                future.completeExceptionally(task.getException());
            }
        });

        return future;
    }

    private CompletableFuture<String> getStableHardwareId() {
        CompletableFuture<String> future = new CompletableFuture<>();
        tapAndPayClient.getStableHardwareId().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                future.complete(task.getResult());
            } else {
                future.completeExceptionally(task.getException());
            }
        });
        return future;
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void isEnabled(Promise promise) {
        CompletableFuture<String> stableHardwareIdFuture = this.getStableHardwareId();

        stableHardwareIdFuture.thenAccept(s -> {
            promise.resolve(true);
        }).exceptionally(e -> {
            promise.resolve(false);
            return null;
        });
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void getTokenStatus(String token, Promise promise) {
        // Call to check the status of the input token
        tapAndPayClient.getTokenStatus(TapAndPay.TOKEN_PROVIDER_VISA, token).addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                // Update the view with the result
                promise.resolve(task.getResult());
            } else {
                ApiException apiException = (ApiException) task.getException();
                promise.reject(apiException);
            }
        });
    }

    private void fetchOPC(OPCRequest req) {
        String url = req.isTestnet ? "https://card-staging.whales-api.com" : "https://card-prod.whales-api.com";

        OkHttpClient client = new OkHttpClient();

        JSONObject body = new JSONObject();
        JSONObject params = new JSONObject();

        try {
            params.put("walletAccountId", req.walletId);
            params.put("deviceId", req.stableHardwareId);

            body.put("params", params);
            body.put("token", req.token);
            body.put("id", req.cardId);
        } catch (JSONException e) {
            req.future.completeExceptionally(e);
        }

        RequestBody requestBody = RequestBody.create(body.toString(), MediaType.parse("application/json"));

        // POST request to fetch OPC
        Request request = new Request.Builder().url(url + "/v2/card/get/google/provisioning/data").post(requestBody).build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                req.future.completeExceptionally(e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if (response.isSuccessful()) {
                    ResponseBody responseBody = response.body();

                    if (responseBody != null) {
                        String body = responseBody.string();

                        JSONObject json = null;
                        try {
                            json = new JSONObject(body);
                        } catch (JSONException e) {
                            req.future.completeExceptionally(e);
                        }
                        try {
                            if (json.has("error")) {
                                req.future.completeExceptionally(new Exception(json.getString("error")));
                            } else if (json.has("data")) {
                                JSONObject data = json.getJSONObject("data");

                                if (data.has("encryptedData")) {
                                    req.future.complete(data.getString("encryptedData"));
                                } else {
                                    req.future.completeExceptionally(new Exception("Missing encryptedData"));
                                }
                            } else {
                                req.future.completeExceptionally(new Exception("Missing data"));
                            }
                        } catch (JSONException e) {
                            req.future.completeExceptionally(e);
                        }
                    } else {
                        req.future.completeExceptionally(new Exception("Empty body"));
                    }

                } else {
                    req.future.completeExceptionally(new Exception("Failed to fetch OPC"));
                }
            }
        });
    }

    private CompletableFuture<TokenStatus> shouldOpenInWallet(String fpanLastFour) {
        CompletableFuture<TokenStatus> future = new CompletableFuture<>();

        this.getTokenStatusByFpanLastFour(fpanLastFour).thenAccept((res) -> {
            if (res.status == -1) {
                future.complete(null);
                return;
            }
            if (res.status != TapAndPay.TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION && res.status != TapAndPay.TOKEN_STATE_FELICA_PENDING_PROVISIONING) {
                future.complete(null);
            } else {
                future.complete(new TokenStatus(res.status, res.issuerToken));
            }
        }).exceptionally(e -> {
            future.completeExceptionally(e);
            return null;
        });

        return future;
    }

    private void pushProvisionWithTokeStatusCheck(ProvisionRequest req) {
        if (currentProvisioning != null) {
            req.completableFuture.completeExceptionally(new Exception("Another provisioning is in progress"));
            return;
        }

        this.currentProvisioning = req;

        this.shouldOpenInWallet(req.lastDigits).thenAccept((tokenStatus) -> {
            if (tokenStatus != null && tokenStatus.issuerToken != null) {
                // open in wallet
                ViewTokenRequest request = new ViewTokenRequest.Builder().setTokenServiceProvider(TapAndPay.CARD_NETWORK_VISA).setIssuerTokenId(tokenStatus.issuerToken).build();
                tapAndPayClient.viewToken(request).addOnCompleteListener(new OnCompleteListener<PendingIntent>() {
                    @Override
                    public void onComplete(@NonNull Task<PendingIntent> task) {
                        if (task.isSuccessful()) {
                            try {
                                task.getResult().send();
                            } catch (PendingIntent.CanceledException e) {}
                        } else {
                            ApiException apiException = (ApiException) task.getException();
                        }
                    }
                });
                this.currentProvisioning.completableFuture.complete(false);
                this.currentProvisioning = null;
            } else {
                CompletableFuture<String> futureOpc = new CompletableFuture<>();
                CompletableFuture<String> walletIdFuture = this.getActiveWalletId();
                CompletableFuture<String> stableHardwareIdFuture = this.getStableHardwareId();

                // await for both walletId and stableHardwareId
                walletIdFuture.thenCombine(stableHardwareIdFuture, (walletId, stableHardwareId) -> new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc)).exceptionally(e -> {
                    // if exception is TAP_AND_PAY_NO_ACTIVE_WALLET There is no active wallet -> create wallet
                    Throwable cause = e instanceof CompletionException ? e.getCause() : e;
                    String causeMessage = cause != null ? cause.getMessage() : null;

                    if (cause instanceof ApiException || (causeMessage != null && causeMessage.contains("15002"))) {
                        ApiException apiException = (ApiException) cause;
                        if (apiException.getStatusCode() == 15002) {
                            createWallet().thenAccept(res -> {
                                if (res) {
                                    CompletableFuture<String> walletIdFuture2 = this.getActiveWalletId();
                                    CompletableFuture<String> stableHardwareIdFuture2 = this.getStableHardwareId();

                                    walletIdFuture2.thenCombine(stableHardwareIdFuture2, (walletId, stableHardwareId) -> {
                                        return new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc);
                                    }).exceptionally(e2 -> {
                                        req.completableFuture.completeExceptionally(e2);
                                        return null;
                                    }).thenAccept(this::fetchOPC).exceptionally(e2 -> {
                                        req.completableFuture.completeExceptionally(e2);
                                        return null;
                                    });
                                } else {
                                    req.completableFuture.completeExceptionally(new Exception("Failed to create wallet"));
                                }
                            });
                        } else {
                            req.completableFuture.completeExceptionally(e);
                        }
                    } else {
                        req.completableFuture.completeExceptionally(e);
                    }
                    return null;
                }).thenAccept(this::fetchOPC).exceptionally(e -> {
                    req.completableFuture.completeExceptionally(e);
                    return null;
                });

                futureOpc.thenAccept(opc -> {
                    // UserAddress userAddress = UserAddress.newBuilder()
                    //     .setName(req.name)
                    //     .setAddress1(req.address1)
                    //     .setLocality(req.locality)
                    //     .setAdministrativeArea(req.administrativeArea)
                    //     .setCountryCode(req.countryCode)
                    //     .setPostalCode(req.postalCode)
                    //     .setPhoneNumber(req.phoneNumber)
                    //     .build();

                    PushTokenizeRequest pushTokenizeRequest = new PushTokenizeRequest.Builder().setOpaquePaymentCard(opc.getBytes()).setNetwork(TapAndPay.CARD_NETWORK_VISA).setTokenServiceProvider(TapAndPay.TOKEN_PROVIDER_VISA).setDisplayName(req.displayName).setLastDigits(req.lastDigits)
                            // .setUserAddress(userAddress)
                            .build();

                    Activity currentActivity = getReactApplicationContext().getCurrentActivity();

                    if (currentActivity != null) {
                        tapAndPayClient.pushTokenize(currentActivity, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE);
                    } else {
                        if (this.currentProvisioning != null) {
                            this.currentProvisioning.completableFuture.completeExceptionally(new Exception("No current activity"));
                            this.currentProvisioning = null;
                        }
                    }
                }).exceptionally(e -> {
                    if (this.currentProvisioning != null) {
                        this.currentProvisioning.completableFuture.completeExceptionally(e);
                        this.currentProvisioning = null;
                    }
                    return null;
                });
            }
        }).exceptionally(e -> {
            if (this.currentProvisioning != null) {
                this.currentProvisioning.completableFuture.completeExceptionally(e);
                this.currentProvisioning = null;
            }
            return null;
        });
    }

    private void pushProvision(ProvisionRequest req) {
        if (currentProvisioning != null) {
            req.completableFuture.completeExceptionally(new Exception("Another provisioning is in progress"));
            return;
        }

        this.currentProvisioning = req;

        CompletableFuture<String> futureOpc = new CompletableFuture<>();
        CompletableFuture<String> walletIdFuture = this.getActiveWalletId();
        CompletableFuture<String> stableHardwareIdFuture = this.getStableHardwareId();

        // await for both walletId and stableHardwareId
        walletIdFuture.thenCombine(stableHardwareIdFuture, (walletId, stableHardwareId) -> new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc)).exceptionally(e -> {
            // if exception is TAP_AND_PAY_NO_ACTIVE_WALLET There is no active wallet -> create wallet
            Throwable cause = e instanceof CompletionException ? e.getCause() : e;
            String causeMessage = cause != null ? cause.getMessage() : null;

            if (cause instanceof ApiException || (causeMessage != null && causeMessage.contains("15002"))) {
                ApiException apiException = (ApiException) cause;
                if (apiException.getStatusCode() == 15002) {
                    createWallet().thenAccept(res -> {
                        if (res) {
                            CompletableFuture<String> walletIdFuture2 = this.getActiveWalletId();
                            CompletableFuture<String> stableHardwareIdFuture2 = this.getStableHardwareId();

                            walletIdFuture2.thenCombine(stableHardwareIdFuture2, (walletId, stableHardwareId) -> {
                                return new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc);
                            }).exceptionally(e2 -> {
                                req.completableFuture.completeExceptionally(e2);
                                return null;
                            }).thenAccept(this::fetchOPC).exceptionally(e2 -> {
                                req.completableFuture.completeExceptionally(e2);
                                return null;
                            });
                        } else {
                            req.completableFuture.completeExceptionally(new Exception("Failed to create wallet"));
                        }
                    });
                } else {
                    req.completableFuture.completeExceptionally(e);
                }
            } else {
                req.completableFuture.completeExceptionally(e);
            }
            return null;
        }).thenAccept(this::fetchOPC).exceptionally(e -> {
            req.completableFuture.completeExceptionally(e);
            return null;
        });

        futureOpc.thenAccept(opc -> {
            // UserAddress userAddress = UserAddress.newBuilder()
            //     .setName(req.name)
            //     .setAddress1(req.address1)
            //     .setLocality(req.locality)
            //     .setAdministrativeArea(req.administrativeArea)
            //     .setCountryCode(req.countryCode)
            //     .setPostalCode(req.postalCode)
            //     .setPhoneNumber(req.phoneNumber)
            //     .build();

            PushTokenizeRequest pushTokenizeRequest = new PushTokenizeRequest.Builder().setOpaquePaymentCard(opc.getBytes()).setNetwork(TapAndPay.CARD_NETWORK_VISA).setTokenServiceProvider(TapAndPay.TOKEN_PROVIDER_VISA).setDisplayName(req.displayName).setLastDigits(req.lastDigits)
                    // .setUserAddress(userAddress)
                    .build();

            Activity currentActivity = getReactApplicationContext().getCurrentActivity();

            if (currentActivity != null) {
                tapAndPayClient.pushTokenize(currentActivity, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE);
            } else {
                if (this.currentProvisioning != null) {
                    this.currentProvisioning.completableFuture.completeExceptionally(new Exception("No current activity"));
                    this.currentProvisioning = null;
                }
            }
        }).exceptionally(e -> {
            if (this.currentProvisioning != null) {
                this.currentProvisioning.completableFuture.completeExceptionally(e);
                this.currentProvisioning = null;
            }
            return null;
        });
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void addCardToWallet(String token, String cardId, String displayName, String lastDigits, boolean isTestnet, Promise promise) {
        // create a new CompletableFuture to handle the result of the tokenization
        // result will be resolved with true if tokenization was successful, false if it was cancelled, or rejected with an exception if it failed
        // completes in handleTokenizationResult with final result

        CompletableFuture<Boolean> future = new CompletableFuture<>();
        future.thenAccept(res -> {
            promise.resolve(res);
        }).exceptionally(e -> {
            promise.reject(e);
            return null;
        }).thenRun(() -> {
            this.currentProvisioning = null;
        });

        ProvisionRequest req = new ProvisionRequest(isTestnet, token, cardId, displayName, lastDigits, future);
        // Adding card regardless of the token status
        // pushProvision(req);
        // Adding card only if it's not already added, otherwise open in wallet
        pushProvisionWithTokeStatusCheck(req);
    }

    public void handleTokenizationResult(int resultCode, Intent data) {
        if (this.currentProvisioning == null) {
            return;
        }

        switch (resultCode) {
            case TAP_AND_PAY_ATTESTATION_ERROR:
                // Tokenization failed due to device attestation error, so you should choose how to handle
                // this and alert your users.

                this.currentProvisioning.completableFuture.completeExceptionally(new Exception("Device attestation error"));

                break;
            case Activity.RESULT_OK:
                // Tokenization was successful, so choose how to handle this and alert your users.
                this.currentProvisioning.completableFuture.complete(true);
                break;
            case Activity.RESULT_CANCELED:
                // Tokenization was cancelled, so choose how to handle this and alert your users.
                this.currentProvisioning.completableFuture.complete(false);
                break;
        }

        this.currentProvisioning = null;
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void getEnvironment(Promise promise) {
        tapAndPayClient.getEnvironment().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                promise.resolve(task.getResult());
            } else {
                ApiException apiException = (ApiException) task.getException();
                promise.reject(apiException);
            }
        });
    }

    private void handleSetDefaultWalletResult(int resultCode, Intent data) {
        if (isDefaultWalletFuture != null) {
            if (resultCode == Activity.RESULT_OK) {
                isDefaultWalletFuture.complete(true);
            } else {
                isDefaultWalletFuture.complete(false);
            }

            isDefaultWalletFuture = null;
        }
    }

    @Override
    public void onActivityResult(Activity activity, int i, int i1, @Nullable Intent intent) {
        if (i == REQUEST_CODE_PUSH_TOKENIZE) {
            handleTokenizationResult(i1, intent);
        }
        if (i == SET_DEFAULT_PAYMENTS_REQUEST_CODE) {
            handleSetDefaultWalletResult(i1, intent);
        }
        if (i == REQUEST_CREATE_WALLET) {
            if (walletAddFuture != null) {
                if (i1 == Activity.RESULT_OK) {
                    walletAddFuture.complete(true);
                } else {
                    walletAddFuture.complete(false);
                }

                walletAddFuture = null;
            }
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
    }
}