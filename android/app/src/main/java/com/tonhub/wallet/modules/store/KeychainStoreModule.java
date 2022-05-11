package com.tonhub.wallet.modules.store;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class KeychainStoreModule extends ReactContextBaseJavaModule {
    private final Context mContext;
    private static final int SECURITY_LEVEL_NONE = 0;
    private static final int SECURITY_LEVEL_SECRET = 1;
    private static final int SECURITY_LEVEL_BIOMETRIC = 2;
    private final BiometricManager biometricManager;

    KeychainStoreModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
        biometricManager = BiometricManager.from(context);
    }

    public KeyguardManager keyguardManager() {
        return (KeyguardManager) mContext.getSystemService(Context.KEYGUARD_SERVICE);
    }

    private Boolean isDeviceSecure() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return keyguardManager().isDeviceSecure();
        } else {
            // NOTE: `KeyguardManager#isKeyguardSecure()` considers SIM locked state,
            // but it will be ignored on falling-back to device credential on biometric authentication.
            // That means, setting level to `SECURITY_LEVEL_SECRET` might be misleading for some users.
            // But there is no equivalent APIs prior to M.
            // `andriodx.biometric.BiometricManager#canAuthenticate(int)` looks like an alternative,
            // but specifying `BiometricManager.Authenticators.DEVICE_CREDENTIAL` alone is not
            // supported prior to API 30.
            // https://developer.android.com/reference/androidx/biometric/BiometricManager#canAuthenticate(int)
            return keyguardManager().isKeyguardSecure();
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "KeychainStore";
    }

    @ReactMethod
    @SuppressWarnings("unused")
    public void getEnrolledLevelAsync(Promise promise) {
        int level = SECURITY_LEVEL_NONE;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            int result = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            if (result == BiometricManager.BIOMETRIC_SUCCESS) {
                level = SECURITY_LEVEL_BIOMETRIC;
            }
        } else {
            int deviceCredentialResult = biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL);
            if (deviceCredentialResult == BiometricManager.BIOMETRIC_SUCCESS) {
                level = SECURITY_LEVEL_SECRET;
            }
            int biometricResult = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            if (biometricResult == BiometricManager.BIOMETRIC_SUCCESS) {
                level = SECURITY_LEVEL_BIOMETRIC;
            }
        }
      promise.resolve(level);
    }
}