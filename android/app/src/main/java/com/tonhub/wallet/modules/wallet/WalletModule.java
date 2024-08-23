package com.tonhub.wallet.modules.wallet;

import static com.google.android.gms.tapandpay.TapAndPayStatusCodes.TAP_AND_PAY_ATTESTATION_ERROR;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.NfcManager;
import android.nfc.cardemulation.CardEmulation;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tapandpay.TapAndPay;
import com.google.android.gms.tapandpay.TapAndPayClient;
import com.google.android.gms.tapandpay.issuer.PushTokenizeRequest;
import com.google.android.gms.tapandpay.issuer.TokenInfo;
import com.google.android.gms.tapandpay.issuer.TokenStatus;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

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

    public WalletModule(ReactApplicationContext reactContext) {
        super(reactContext);
        tapAndPayClient = TapAndPay.getClient(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "WalletModule";
    }

    private CompletableFuture<WritableArray> getTokenInfoList() {
        CompletableFuture<WritableArray> future = new CompletableFuture<>();
        tapAndPayClient.listTokens().addOnCompleteListener(task -> {

            Log.d("WalletModule", "Listing tokens");

            if (task.isSuccessful()) {
                List<TokenInfo> tokenInfoList = task.getResult();
                Log.d("WalletModule", "Token list: " + tokenInfoList);
                WritableArray tokenArray = Arguments.createArray();

                for (TokenInfo tokenInfo : tokenInfoList) {
                    Log.d("WalletModule", "Token info: " + tokenInfo);
                    WritableMap tokenMap = Arguments.createMap();

                    tokenMap.putString("issuerTokenId", tokenInfo.getIssuerTokenId());
                    tokenMap.putString("dpanLastFour", tokenInfo.getDpanLastFour());
                    tokenMap.putString("tokenState", tokenInfo.getFpanLastFour());
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

    @ReactMethod
    @SuppressWarnings("unused")
    private void listTokens(Promise promise) {
        getTokenInfoList().thenAccept(promise::resolve).exceptionally(e -> {
            promise.reject(e);
            return null;
        });
        // tapAndPayClient.listTokens().addOnCompleteListener(task -> {
        //     if (task.isSuccessful()) {
        //         List<TokenInfo> tokenInfoList = task.getResult();
        //         WritableArray tokenArray = Arguments.createArray();

        //         for (TokenInfo tokenInfo : tokenInfoList) {
        //             WritableMap tokenMap = Arguments.createMap();

        //             tokenMap.putString("issuerTokenId", tokenInfo.getIssuerTokenId());
        //             tokenMap.putString("dpanLastFour", tokenInfo.getDpanLastFour());
        //             tokenMap.putString("tokenState", tokenInfo.getFpanLastFour());
        //             tokenMap.putInt("tokenState", tokenInfo.getTokenState());
        //             tokenMap.putString("issuerName", tokenInfo.getIssuerName());
        //             tokenMap.putString("portfolioName", tokenInfo.getPortfolioName());
        //             tokenMap.putBoolean("isDefaultToken", tokenInfo.getIsDefaultToken());

        //             tokenArray.pushMap(tokenMap);
        //         }

        //         promise.resolve(tokenArray);
        //     } else {
        //         ApiException apiException = (ApiException) task.getException();
        //         promise.reject(apiException);
        //     }
        // });
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void checkIfCardIsAlreadyAdded(String primaryAccountNumberSuffix, Promise promise) {
        getTokenInfoList().thenAccept(tokenArray -> {
            for (int i = 0; i < tokenArray.size(); i++) {
                ReadableMap tokenMap = tokenArray.getMap(i);
                String dpanLastFour = tokenMap.getString("dpanLastFour");
                if (dpanLastFour != null && dpanLastFour.equals(primaryAccountNumberSuffix)) {
                    promise.resolve(true);
                    return;
                }
            }

            promise.resolve(false);
        }).exceptionally(e -> {
            promise.reject(e);
            return null;
        });
    }

    private Boolean isDefaultWallet() {
        NfcManager nfcManager = (NfcManager) getReactApplicationContext().getSystemService(Context.NFC_SERVICE);
        NfcAdapter adapter = nfcManager.getDefaultAdapter();
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
    }

    private CompletableFuture<String> getActiveWalletId() {
        CompletableFuture<String> future = new CompletableFuture<>();
        tapAndPayClient.getActiveWalletId().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                Log.d("WalletModule", "Active wallet id: " + task.getResult());
                future.complete(task.getResult());
            } else {
                Log.e("WalletModule", "Failed to get active wallet id", task.getException());
                future.completeExceptionally(task.getException());
            }
        });

        return future;
    }

    private CompletableFuture<String> getStableHardwareId() {
        CompletableFuture<String> future = new CompletableFuture<>();
        tapAndPayClient.getStableHardwareId().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                Log.d("WalletModule", "Stable hardware id: " + task.getResult());
                future.complete(task.getResult());
            } else {
                Log.e("WalletModule", "Failed to get stable hardware id", task.getException());
                future.completeExceptionally(task.getException());
            }
        });
        return future;
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void isEnabled(Promise promise) {
        CompletableFuture<String> walletIdFuture = this.getActiveWalletId();
        CompletableFuture<String> stableHardwareIdFuture = this.getStableHardwareId();

        walletIdFuture.thenCombine(stableHardwareIdFuture, (walletId, stableHardwareId) -> {
            Log.d("WalletModule", "Wallet id: " + walletId + "Stable hardware id: " + stableHardwareId);
            promise.resolve(true);
            return null;
        }).exceptionally(e -> {
            Log.e("WalletModule", "Failed to combine wallet ID and stable hardware ID", e);
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

        Log.d("WalletModule", "Req body:" + body);

        RequestBody requestBody = RequestBody.create(body.toString(), MediaType.parse("application/json"));

        // POST request to fetch OPC
        Request request = new Request.Builder().url(url + "/v2/card/get/google/provisioning/data").post(requestBody).build();

        Log.d("WalletModule", "Req body:" + request.body());

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e("WalletModule", "Failed to fetch OPC", e);
                req.future.completeExceptionally(e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                Log.d("WalletModule", "Response received");
                if (response.isSuccessful()) {
                    Log.d("WalletModule", "Response is successful");
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
                            Log.d("WalletModule", "JSON: " + json.toString());

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
                    Log.e("WalletModule", "Failed to fetch OPC" + response.code());
                    req.future.completeExceptionally(new Exception("Failed to fetch OPC"));
                }
            }
        });
    }

    private void pushProvision(ProvisionRequest req) {
        if (currentProvisioning != null) {
            Log.e("WalletModule", "Another provisioning is in progress");
            req.completableFuture.completeExceptionally(new Exception("Another provisioning is in progress"));
            return;
        }

        this.currentProvisioning = req;

        CompletableFuture<String> futureOpc = new CompletableFuture<>();
        CompletableFuture<String> walletIdFuture = this.getActiveWalletId();
        CompletableFuture<String> stableHardwareIdFuture = this.getStableHardwareId();

        // await for both walletId and stableHardwareId
        walletIdFuture.thenCombine(stableHardwareIdFuture, (walletId, stableHardwareId) -> {
            Log.d("WalletModule", "Wallet id: " + walletId + "Stable hardware id: " + stableHardwareId);
            return new OPCRequest(req.cardId, req.token, walletId, stableHardwareId, req.isTestnet, futureOpc);
        }).thenAccept(this::fetchOPC).exceptionally(e -> {
            Log.e("WalletModule", "Failed to combine wallet ID and stable hardware ID", e);

            req.completableFuture.completeExceptionally(e);

            return null;
        });

        futureOpc.thenAccept(opc -> {
            Log.d("WalletModule", "OPC: " + opc);
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

            Log.d("WalletModule", String.valueOf(currentActivity != null));

            tapAndPayClient.pushTokenize(currentActivity, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE);
        });
    }

    @ReactMethod
    @SuppressWarnings("unused")
    private void addCardToWallet(String token, String cardId, String displayName, String lastDigits, boolean isTestnet, Promise promise) {
        // create a new CompletableFuture to handle the result of the tokenization
        // result will be resolved with true if tokenization was successful, false if it was cancelled, or rejected with an exception if it failed
        // completes in handleTokenizationResult with final result
        Log.d("WalletModule", "Adding card to wallet");

        CompletableFuture<Boolean> future = new CompletableFuture<>();
        future.thenAccept(res -> {
            Log.e("WalletModule", "Tokenization success");
            promise.resolve(true);
        }).exceptionally(e -> {
            Log.e("WalletModule", "Failed to tokenize card");
            promise.reject(e);
            return null;
        }).thenRun(() -> {
            Log.d("WalletModule", "Tokenization completed");
            this.currentProvisioning = null;
        });

        ProvisionRequest req = new ProvisionRequest(isTestnet, token, cardId, displayName, lastDigits, future);
        pushProvision(req);
    }

    public void handleTokenizationResult(int resultCode, Intent data) {
        Log.d("WalletModule", "Handling tokenization result");
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
        // log that we are getting the environment
        Log.d("WalletModule", "Getting environment");
        tapAndPayClient.getEnvironment().addOnCompleteListener(task -> {
            Log.d("WalletModule", "Got environment");
            if (task.isSuccessful()) {
                Log.d("WalletModule", "Environment: " + task.getResult());
                promise.resolve(task.getResult());
            } else {
                ApiException apiException = (ApiException) task.getException();
                Log.d("WalletModule", "Failed to get environment");
                promise.reject(apiException);
            }
        });
    }

    private void handleSetDefaultWalletResult(int resultCode, Intent data) {
        if (resultCode == Activity.RESULT_OK) {
            isDefaultWalletFuture.complete(true);
        } else {
            isDefaultWalletFuture.complete(false);
        }

        isDefaultWalletFuture = null;
    }

    @Override
    public void onActivityResult(Activity activity, int i, int i1, @Nullable Intent intent) {
        Log.d("WalletModule", "onActivityResult");
        if (i == REQUEST_CODE_PUSH_TOKENIZE) {
            Log.d("WalletModule", "Handling push tokenize result");
            handleTokenizationResult(i1, intent);
        }
        if (i == SET_DEFAULT_PAYMENTS_REQUEST_CODE) {
            Log.d("WalletModule", "Handling set default wallet result");
            handleSetDefaultWalletResult(i1, intent);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
    }
}