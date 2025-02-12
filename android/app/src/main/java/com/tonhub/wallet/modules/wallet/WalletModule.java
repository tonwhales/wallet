package com.tonhub.wallet.modules.wallet;

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

    private final Object tapAndPayClient;
    
    private static final int TAP_AND_PAY_ATTESTATION_ERROR = ((Integer)getStaticField("com.google.android.gms.tapandpay.TapAndPayStatusCodes", "TAP_AND_PAY_ATTESTATION_ERROR")).intValue();

    @Nullable
    private ProvisionRequest currentProvisioning;

    @Nullable
    private CompletableFuture<Boolean> isDefaultWalletFuture;
    @Nullable
    private CompletableFuture<Boolean> walletAddFuture;

    public WalletModule(ReactApplicationContext reactContext) {
        super(reactContext);
        tapAndPayClient = getTapAndPayClient(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "WalletModule";
    }

    private Object getTapAndPayClient(ReactApplicationContext context) {
        try {
            Class<?> tapAndPayClass = Class.forName("com.google.android.gms.tapandpay.TapAndPay");
            return tapAndPayClass.getMethod("getClient", Context.class).invoke(null, context);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static Object getStaticField(String className, String fieldName) {
        try {
            Class<?> cls = Class.forName(className);
            return cls.getField(fieldName).get(null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private CompletableFuture<Boolean> createWallet() {
        if (walletAddFuture != null) {
            return walletAddFuture;
        }

        Activity currentActivity = getReactApplicationContext().getCurrentActivity();

        if (currentActivity != null) {
            walletAddFuture = new CompletableFuture<>();
            try {
                tapAndPayClient.getClass()
                    .getMethod("createWallet", Activity.class, int.class)
                    .invoke(tapAndPayClient, currentActivity, REQUEST_CREATE_WALLET);
            } catch(Exception e) {
                walletAddFuture.completeExceptionally(e);
            }
        }

        return walletAddFuture;
    }

    private CompletableFuture<WritableArray> getTokenInfoList() {
        CompletableFuture<WritableArray> future = new CompletableFuture<>();
        try {
            Object task = tapAndPayClient.getClass().getMethod("listTokens").invoke(tapAndPayClient);
            task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<List<?>>() {
                @Override
                public void onComplete(@NonNull Task<List<?>> task) {
                    if (task.isSuccessful()) {
                        // Use List<?> instead of List<TokenInfo>
                        List<?> tokenInfoList = (List<?>) task.getResult();
                        WritableArray tokenArray = Arguments.createArray();
    
                        for (Object tokenInfo : tokenInfoList) {
                            WritableMap tokenMap = Arguments.createMap();
                            try {
                                String issuerTokenId = (String) tokenInfo.getClass().getMethod("getIssuerTokenId").invoke(tokenInfo);
                                String dpanLastFour = (String) tokenInfo.getClass().getMethod("getDpanLastFour").invoke(tokenInfo);
                                String fpanLastFour = (String) tokenInfo.getClass().getMethod("getFpanLastFour").invoke(tokenInfo);
                                int tokenState = ((Integer)tokenInfo.getClass().getMethod("getTokenState").invoke(tokenInfo)).intValue();
                                String issuerName = (String) tokenInfo.getClass().getMethod("getIssuerName").invoke(tokenInfo);
                                String portfolioName = (String) tokenInfo.getClass().getMethod("getPortfolioName").invoke(tokenInfo);
                                boolean isDefaultToken = ((Boolean)tokenInfo.getClass().getMethod("getIsDefaultToken").invoke(tokenInfo)).booleanValue();
    
                                tokenMap.putString("issuerTokenId", issuerTokenId);
                                tokenMap.putString("dpanLastFour", dpanLastFour);
                                tokenMap.putString("fpanLastFour", fpanLastFour);
                                tokenMap.putInt("tokenState", tokenState);
                                tokenMap.putString("issuerName", issuerName);
                                tokenMap.putString("portfolioName", portfolioName);
                                tokenMap.putBoolean("isDefaultToken", isDefaultToken);
                            } catch (Exception e) {
                                // handle reflection exceptions, if needed
                                future.completeExceptionally(e);
                                return;
                            }
                            tokenArray.pushMap(tokenMap);
                        }
    
                        future.complete(tokenArray);
                    } else {
                        ApiException apiException = (ApiException) task.getException();
                        future.completeExceptionally(apiException);
                    }
                }
            });
        } catch(Exception e) {
            future.completeExceptionally(e);
        }
    
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
        try {
            Class<?> isTokenizedRequestClass = Class.forName("com.google.android.gms.tapandpay.issuer.IsTokenizedRequest");
            Object request = isTokenizedRequestClass.getMethod("Builder").invoke(null);
            request.getClass().getMethod("setNetwork", int.class).invoke(request, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "CARD_NETWORK_VISA"));
            request.getClass().getMethod("setTokenServiceProvider", int.class).invoke(request, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_PROVIDER_VISA"));
            request.getClass().getMethod("setIssuerName", String.class).invoke(request, "Holders");
            request.getClass().getMethod("setIdentifier", String.class).invoke(request, primaryAccountNumberSuffix);
            request = request.getClass().getMethod("build").invoke(request);

            Object task = tapAndPayClient.getClass().getMethod("isTokenized", isTokenizedRequestClass).invoke(tapAndPayClient, request);
            task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<Boolean>() {
                @Override
                public void onComplete(@NonNull Task<Boolean> task) {
                    if (task.isSuccessful()) {
                        getTokenStatusByFpanLastFour(primaryAccountNumberSuffix).thenAccept((res) -> {
                            if (res.status == -1) {
                                promise.resolve(false);
                                return;
                            }
                            if (res.status != ((Integer)getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION")).intValue() &&
                                res.status != ((Integer)getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_STATE_FELICA_PENDING_PROVISIONING")).intValue()) {
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
                }
            });
        } catch (Exception e) {
            promise.reject(e);
        }
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
        try {
            Object task = tapAndPayClient.getClass().getMethod("getActiveWalletId").invoke(tapAndPayClient);
            task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (task.isSuccessful()) {
                        future.complete(task.getResult());
                    } else {
                        future.completeExceptionally(task.getException());
                    }
                }
            });
        } catch (Exception e) {
            future.completeExceptionally(e);
        }
        return future;
    }

    private CompletableFuture<String> getStableHardwareId() {
        CompletableFuture<String> future = new CompletableFuture<>();
        try {
            Object task = tapAndPayClient.getClass().getMethod("getStableHardwareId").invoke(tapAndPayClient);
            task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (task.isSuccessful()) {
                        future.complete(task.getResult());
                    } else {
                        future.completeExceptionally(task.getException());
                    }
                }
            });
        } catch (Exception e) {
            future.completeExceptionally(e);
        }
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
        try {
            Object task = tapAndPayClient.getClass().getMethod("getTokenStatus", int.class, String.class).invoke(tapAndPayClient, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_PROVIDER_VISA"), token);
            task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<Integer>() {
                @Override
                public void onComplete(@NonNull Task<Integer> task) {
                    if (task.isSuccessful()) {
                        promise.resolve(task.getResult());
                    } else {
                        ApiException apiException = (ApiException) task.getException();
                        promise.reject(apiException);
                    }
                }
            });
        } catch (Exception e) {
            promise.reject(e);
        }
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
            int tokenStateNeedsIdentVerification = ((Integer)getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION")).intValue();
            int tokenStateFelicPendingProvisioning = ((Integer)getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_STATE_FELICA_PENDING_PROVISIONING")).intValue();
            
            if (res.status == -1) {
                future.complete(null);
                return;
            }
            if (res.status != tokenStateNeedsIdentVerification && res.status != tokenStateFelicPendingProvisioning) {
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
                try {
                    Class<?> viewTokenRequestClass = Class.forName("com.google.android.gms.tapandpay.issuer.ViewTokenRequest");
                    Object request = viewTokenRequestClass.getMethod("Builder").invoke(null);
                    request.getClass().getMethod("setTokenServiceProvider", int.class).invoke(request, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "CARD_NETWORK_VISA"));
                    request.getClass().getMethod("setIssuerTokenId", String.class).invoke(request, tokenStatus.issuerToken);
                    request = request.getClass().getMethod("build").invoke(request);

                    Object task = tapAndPayClient.getClass().getMethod("viewToken", viewTokenRequestClass).invoke(tapAndPayClient, request);
                    task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<PendingIntent>() {
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
                } catch (Exception e) {
                    this.currentProvisioning.completableFuture.completeExceptionally(e);
                }
                this.currentProvisioning.completableFuture.complete(false);
                this.currentProvisioning = null;
            } else {
                CompletableFuture<String> futureOpc = new CompletableFuture<>();
                CompletableFuture<String> walletIdFuture = this.getActiveWalletId();
                CompletableFuture<String> stableHardwareIdFuture = this.getStableHardwareId();

                walletIdFuture.thenCombine(stableHardwareIdFuture, (walletId, stableHardwareId) -> new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc)).exceptionally(e -> {
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
                    try {
                        Class<?> pushTokenizeRequestClass = Class.forName("com.google.android.gms.tapandpay.issuer.PushTokenizeRequest");
                        Object pushTokenizeRequest = pushTokenizeRequestClass.getMethod("Builder").invoke(null);
                        pushTokenizeRequest.getClass().getMethod("setOpaquePaymentCard", byte[].class).invoke(pushTokenizeRequest, opc.getBytes());
                        pushTokenizeRequest.getClass().getMethod("setNetwork", int.class).invoke(pushTokenizeRequest, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "CARD_NETWORK_VISA"));
                        pushTokenizeRequest.getClass().getMethod("setTokenServiceProvider", int.class).invoke(pushTokenizeRequest, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_PROVIDER_VISA"));
                        pushTokenizeRequest.getClass().getMethod("setDisplayName", String.class).invoke(pushTokenizeRequest, req.displayName);
                        pushTokenizeRequest.getClass().getMethod("setLastDigits", String.class).invoke(pushTokenizeRequest, req.lastDigits);
                        pushTokenizeRequest = pushTokenizeRequest.getClass().getMethod("build").invoke(pushTokenizeRequest);

                        Activity currentActivity = getReactApplicationContext().getCurrentActivity();

                        if (currentActivity != null) {
                            tapAndPayClient.getClass().getMethod("pushTokenize", Activity.class, pushTokenizeRequestClass, int.class).invoke(tapAndPayClient, currentActivity, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE);
                        } else {
                            if (this.currentProvisioning != null) {
                                this.currentProvisioning.completableFuture.completeExceptionally(new Exception("No current activity"));
                                this.currentProvisioning = null;
                            }
                        }
                    } catch (Exception e) {
                        if (this.currentProvisioning != null) {
                            this.currentProvisioning.completableFuture.completeExceptionally(e);
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

        walletIdFuture.thenCombine(stableHardwareIdFuture, (walletId, stableHardwareId) -> new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc)).exceptionally(e -> {
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
            try {
                Class<?> pushTokenizeRequestClass = Class.forName("com.google.android.gms.tapandpay.issuer.PushTokenizeRequest");
                Object pushTokenizeRequest = pushTokenizeRequestClass.getMethod("Builder").invoke(null);
                pushTokenizeRequest.getClass().getMethod("setOpaquePaymentCard", byte[].class).invoke(pushTokenizeRequest, opc.getBytes());
                pushTokenizeRequest.getClass().getMethod("setNetwork", int.class).invoke(pushTokenizeRequest, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "CARD_NETWORK_VISA"));
                pushTokenizeRequest.getClass().getMethod("setTokenServiceProvider", int.class).invoke(pushTokenizeRequest, getStaticField("com.google.android.gms.tapandpay.TapAndPay", "TOKEN_PROVIDER_VISA"));
                pushTokenizeRequest.getClass().getMethod("setDisplayName", String.class).invoke(pushTokenizeRequest, req.displayName);
                pushTokenizeRequest.getClass().getMethod("setLastDigits", String.class).invoke(pushTokenizeRequest, req.lastDigits);
                pushTokenizeRequest = pushTokenizeRequest.getClass().getMethod("build").invoke(pushTokenizeRequest);

                Activity currentActivity = getReactApplicationContext().getCurrentActivity();

                if (currentActivity != null) {
                    tapAndPayClient.getClass().getMethod("pushTokenize", Activity.class, pushTokenizeRequestClass, int.class).invoke(tapAndPayClient, currentActivity, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE);
                } else {
                    if (this.currentProvisioning != null) {
                        this.currentProvisioning.completableFuture.completeExceptionally(new Exception("No current activity"));
                        this.currentProvisioning = null;
                    }
                }
            } catch (Exception e) {
                if (this.currentProvisioning != null) {
                    this.currentProvisioning.completableFuture.completeExceptionally(e);
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
        pushProvisionWithTokeStatusCheck(req);
    }

    public void handleTokenizationResult(int resultCode, Intent data) {
        if (this.currentProvisioning == null) {
            return;
        }

        if (resultCode == TAP_AND_PAY_ATTESTATION_ERROR) {
            this.currentProvisioning.completableFuture.completeExceptionally(new Exception("Device attestation error"));
        } else if (resultCode == Activity.RESULT_OK) {
            this.currentProvisioning.completableFuture.complete(true);
        } else if (resultCode == Activity.RESULT_CANCELED) {
            this.currentProvisioning.completableFuture.complete(false);
        }
        
        this.currentProvisioning = null;
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void getEnvironment(Promise promise) {
        try {
            Object task = tapAndPayClient.getClass().getMethod("getEnvironment").invoke(tapAndPayClient);
            task.getClass().getMethod("addOnCompleteListener", OnCompleteListener.class).invoke(task, new OnCompleteListener<Integer>() {
                @Override
                public void onComplete(@NonNull Task<Integer> task) {
                    if (task.isSuccessful()) {
                        promise.resolve(task.getResult());
                    } else {
                        ApiException apiException = (ApiException) task.getException();
                        promise.reject(apiException);
                    }
                }
            });
        } catch (Exception e) {
            promise.reject(e);
        }
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