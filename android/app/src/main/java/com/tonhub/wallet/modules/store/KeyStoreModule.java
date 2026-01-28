package com.tonhub.wallet.modules.store;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.preference.PreferenceManager;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.security.keystore.UserNotAuthenticatedException;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.security.spec.AlgorithmParameterSpec;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class KeyStoreModule extends ReactContextBaseJavaModule {
    private static final String ALIAS_PROPERTY = "keychainService";
    private static final String SHARED_PREFERENCES_NAME = "KeychainStore";
    private static final String SCHEME_PROPERTY = "scheme";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    static final String TAG = "KeyStore";

    private final Context mContext;
    private AESEncrypter mAESEncrypter;
    private final BiometricManager biometricManager;
    private AuthenticationHelper mAuthenticationHelper;
    private KeyStore mKeyStore;

    private static final int SECURITY_LEVEL_NONE = 0;
    private static final int SECURITY_LEVEL_SECRET = 1;
    private static final int SECURITY_LEVEL_BIOMETRIC = 2;

    KeyStoreModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
        biometricManager = BiometricManager.from(context);
        mAESEncrypter = new AESEncrypter();
        mAuthenticationHelper = new AuthenticationHelper(context);
    }

    @ReactMethod
    @SuppressWarnings("unused")
    public void setValueWithKeyAsync(String value, String key, Promise promise) {
        try {
            setItemImpl(key, value, promise);
        } catch (Exception e) {
            Log.e(TAG, "Caught unexpected exception when writing to KeyStoreModule", e);
            promise.reject("WRITE_ERROR", "An unexpected error occurred when writing to KeyStoreModule", e);
        }
    }

    private void setItemImpl(String key, String value, Promise promise) {
        if (key == null) {
            promise.reject("NULL_KEY", "KeyStoreModule keys must not be null");
            return;
        }

        SharedPreferences prefs = mContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);

        if (value == null) {
            boolean success = prefs.edit().putString(key, null).commit();
            if (success) {
                promise.resolve(null);
            } else {
                promise.reject("WRITE_ERROR", "Could not write a null value to KeyStoreModule");
            }
            return;
        }

        try {
            KeyStore keyStore = getKeyStore();
            KeyStore.SecretKeyEntry secretKeyEntry = getKeyEntry(KeyStore.SecretKeyEntry.class, mAESEncrypter);
            mAESEncrypter.createEncryptedItem(
                    promise, value, keyStore, secretKeyEntry, mAuthenticationHelper.getDefaultCallback(),
                    (innerPromise, result) -> {
                        JSONObject obj = (JSONObject) result;
                        obj.put(SCHEME_PROPERTY, AESEncrypter.NAME);
                        saveEncryptedItem(innerPromise, obj, prefs, key);
                    });
        } catch (IOException e) {
            Log.w(TAG, e);
            promise.reject("IO_ERROR", "There was an I/O error loading the keystore for KeyStoreModule", e);
        } catch (GeneralSecurityException e) {
            Log.w(TAG, e);
            promise.reject("ENCRYPT_ERROR", "Could not encrypt the value for KeyStoreModule", e);
        }
    }

    private void saveEncryptedItem(Promise promise, JSONObject encryptedItem, SharedPreferences prefs, String key) {
        String encryptedItemString = encryptedItem.toString();
        if (encryptedItemString == null) { // lint warning suppressed, JSONObject#toString() may return null
            promise.reject("JSON_ERROR", "Could not JSON-encode the encrypted item for KeyStoreModule");
            return;
        }

        boolean success = prefs.edit().putString(key, encryptedItemString).commit();
        if (success) {
            promise.resolve(null);
        } else {
            promise.reject("WRITE_ERROR", "Could not write encrypted JSON to KeyStoreModule");
        }
    }

    @NonNull
    @Override
    public String getName() {
        return TAG;
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
            int deviceCredentialResult = biometricManager
                    .canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL);
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

    @ReactMethod
    @SuppressWarnings("unused")
    public void getValueWithKeyAsync(String key, Promise promise) {
        try {
            getItemImpl(key, promise);
        } catch (Exception e) {
            Log.e(TAG, "Caught unexpected exception when reading from KeyStoreModule", e);
            promise.reject("READ_ERROR", "An unexpected error occurred when reading from KeyStoreModule", e);
        }
    }

    private void getItemImpl(String key, Promise promise) {
        // We use a KeyStoreModule-specific shared preferences file, which lets us do
        // things like enumerate
        // its entries or clear all of them
        SharedPreferences prefs = getSharedPreferences();
        readJSONEncodedItem(key, prefs, promise);
    }

    private void readJSONEncodedItem(String key, SharedPreferences prefs, Promise promise) {
        String encryptedItemString = prefs.getString(key, null);
        JSONObject encryptedItem;
        try {
            encryptedItem = new JSONObject(encryptedItemString);
        } catch (JSONException e) {
            Log.e(TAG, String.format("Could not parse stored value as JSON (key = %s, value = %s)", key,
                    encryptedItemString), e);
            promise.reject("JSON_ERROR", "Could not parse the encrypted JSON item in KeyStoreModule");
            return;
        }

        String scheme = encryptedItem.optString(SCHEME_PROPERTY);

        try {
            if (AESEncrypter.NAME.equals(scheme)) {
                KeyStore.SecretKeyEntry secretKeyEntry = getKeyEntry(KeyStore.SecretKeyEntry.class, mAESEncrypter);
                mAESEncrypter.decryptItem(promise, encryptedItem, secretKeyEntry,
                        mAuthenticationHelper.getDefaultCallback());
            } else {
                String message = String.format(
                        "The item for key \"%s\" in KeyStoreModule has an unknown encoding scheme (%s)", key, scheme);
                Log.e(TAG, message);
                promise.reject("DECODE_ERROR", message);
            }
        } catch (IOException e) {
            Log.w(TAG, e);
            promise.reject("IO_ERROR", "There was an I/O error loading the keystore for KeyStoreModule", e);
        } catch (GeneralSecurityException e) {
            Log.w(TAG, e);
            promise.reject("DECRYPT_ERROR", "Could not decrypt the item in KeyStoreModule", e);
        } catch (JSONException e) {
            Log.w(TAG, e);
            promise.reject("DECODE_ERROR", "Could not decode the encrypted JSON item in KeyStoreModule", e);
        }
    }

    @ReactMethod
    @SuppressWarnings("unused")
    public void deleteValueWithKeyAsync(String key, com.facebook.react.bridge.ReadableMap options, Promise promise) {
        try {
            deleteItemImpl(key, promise);
        } catch (Exception e) {
            Log.e(TAG, "Caught unexpected exception when deleting from KeyStoreModule", e);
            promise.reject("DELETE_ERROR", "An unexpected error occurred when deleting item from KeyStoreModule", e);
        }
    }

    private void deleteItemImpl(String key, Promise promise) {
        boolean success = true;
        SharedPreferences prefs = getSharedPreferences();
        if (prefs.contains(key)) {
            success = prefs.edit().remove(key).commit();
        }

        SharedPreferences legacyPrefs = PreferenceManager.getDefaultSharedPreferences(mContext);
        if (legacyPrefs.contains(key)) {
            success = legacyPrefs.edit().remove(key).commit() && success;
        }

        if (success) {
            promise.resolve(null);
        } else {
            promise.reject("DELETE_ERROR", "Could not delete the item from KeyStoreModule");
        }
    }

    /**
     * We use a shared preferences file that's scoped to both the experience and
     * KeyStoreModule. This
     * lets us easily list or remove all the entries for an experience.
     */
    protected SharedPreferences getSharedPreferences() {
        return mContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private KeyStore getKeyStore()
            throws IOException, KeyStoreException, NoSuchAlgorithmException, CertificateException {
        if (mKeyStore == null) {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);
            mKeyStore = keyStore;
        }
        return mKeyStore;
    }

    private <E extends KeyStore.Entry> E getKeyEntry(Class<E> keyStoreEntryClass,
            KeyBasedEncrypter<E> encrypter) throws IOException, GeneralSecurityException {
        KeyStore keyStore = getKeyStore();
        String keystoreAlias = encrypter.getKeyStoreAlias();

        E keyStoreEntry;
        if (!keyStore.containsAlias(keystoreAlias)) {
            keyStoreEntry = encrypter.initializeKeyStoreEntry(keyStore);
        } else {
            KeyStore.Entry entry = keyStore.getEntry(keystoreAlias, null);
            if (!keyStoreEntryClass.isInstance(entry)) {
                String message = String.format(
                        "The entry for the keystore alias \"%s\" is not a %s",
                        keystoreAlias, keyStoreEntryClass.getSimpleName());
                throw new KeyStoreException(message);
            }
            keyStoreEntry = keyStoreEntryClass.cast(entry);
        }

        return keyStoreEntry;
    }

    private interface KeyBasedEncrypter<E extends KeyStore.Entry> {
        @SuppressWarnings("unused")
        String getKeyStoreAlias();

        @SuppressWarnings("unused")
        E initializeKeyStoreEntry(KeyStore keyStore) throws GeneralSecurityException;

        @SuppressWarnings("unused")
        void createEncryptedItem(Promise promise, String plaintextValue, KeyStore keyStore, E keyStoreEntry,
                AuthenticationCallback authenticationCallback, PostEncryptionCallback postEncryptionCallback)
                throws GeneralSecurityException, JSONException;

        @SuppressWarnings("unused")
        void decryptItem(Promise promise, JSONObject encryptedItem, E keyStoreEntry, AuthenticationCallback callback)
                throws GeneralSecurityException, JSONException;
    }

    /**
     * An encrypter that stores a symmetric key (AES) in the Android keystore. It
     * generates a new IV
     * each time an item is written to prevent many-time pad attacks. The IV is
     * stored with the
     * encrypted item.
     */
    protected static class AESEncrypter implements KeyStoreModule.KeyBasedEncrypter<KeyStore.SecretKeyEntry> {
        public static final String NAME = "aes";

        private static final String DEFAULT_ALIAS = "tonhub_v4";
        private static final String AES_CIPHER = "AES/GCM/NoPadding";
        private static final int AES_KEY_SIZE_BITS = 256;

        private static final String CIPHERTEXT_PROPERTY = "ct";
        private static final String IV_PROPERTY = "iv";
        private static final String GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY = "tlen";

        @Override
        public String getKeyStoreAlias() {
            return AES_CIPHER + ":" + DEFAULT_ALIAS;
        }

        /**
         * Initialising KeyStoreEntry only with DEVICE_CREDENTIAL authentication
         *
         * @param keyStore
         * @return
         * @throws GeneralSecurityException
         */
        @SuppressLint("WrongConstant")
        @Override
        public KeyStore.SecretKeyEntry initializeKeyStoreEntry(KeyStore keyStore) throws GeneralSecurityException {
            String keystoreAlias = getKeyStoreAlias();
            int keyPurposes = KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT;
            // Configure specs
            KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(keystoreAlias, keyPurposes)
                    .setKeySize(AES_KEY_SIZE_BITS)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE);

            // Enable user authentication
            builder = builder.setUserAuthenticationRequired(true);

            // Set auth validity: per-use-auth
            builder = builder.setUserAuthenticationValidityDurationSeconds(0);

            // Require device to be unlocked
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                builder = builder.setUnlockedDeviceRequired(true);
            }

            // Disable invalidation since we don't want to randomly lose data
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder = builder.setInvalidatedByBiometricEnrollment(false);
            }

            // Disable strongbox since we don't want to randomly lose data for some internal
            // magic
            // CPU-bound encryption is enough for our case
            // There are a lot of examples of instability and slowness
            // Some random example: https://github.com/beemdevelopment/Aegis/issues/87
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                builder = builder.setIsStrongBoxBacked(false);
            }

            // Enable device credential and biometric auth on new devices
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                builder = builder.setUserAuthenticationParameters(0,
                        KeyProperties.AUTH_DEVICE_CREDENTIAL | KeyProperties.AUTH_BIOMETRIC_STRONG);
            }

            // Init generator
            AlgorithmParameterSpec algorithmSpec = builder.build();
            KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,
                    keyStore.getProvider());
            keyGenerator.init(algorithmSpec);

            // KeyGenParameterSpec stores the key when it is generated
            keyGenerator.generateKey();

            // Check result
            KeyStore.SecretKeyEntry keyStoreEntry = (KeyStore.SecretKeyEntry) keyStore.getEntry(keystoreAlias, null);
            if (keyStoreEntry == null) {
                throw new UnrecoverableEntryException("Could not retrieve the newly generated secret key entry");
            }

            return keyStoreEntry;
        }

        @Override
        public void createEncryptedItem(
                Promise promise,
                String plaintextValue,
                KeyStore keyStore,
                KeyStore.SecretKeyEntry secretKeyEntry,
                AuthenticationCallback authenticationCallback,
                PostEncryptionCallback postEncryptionCallback) throws GeneralSecurityException {

            SecretKey secretKey = secretKeyEntry.getSecretKey();
            Cipher cipher = Cipher.getInstance(AES_CIPHER);
            try {
                cipher.init(Cipher.ENCRYPT_MODE, secretKey);
                authenticationCallback.checkAuthentication(promise, cipher,
                        (promise1, cipher1, postEncryptionCallback1) -> {
                            GCMParameterSpec gcmSpec = cipher1.getParameters().getParameterSpec(GCMParameterSpec.class);
                            return createEncryptedItem(
                                    promise1,
                                    plaintextValue,
                                    cipher1,
                                    gcmSpec,
                                    postEncryptionCallback1);
                        },
                        postEncryptionCallback);
            } catch (UserNotAuthenticatedException e) {
                authenticationCallback.checkAuthNoCipher(promise, (success) -> {
                    if (success) {
                        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
                        authenticationCallback.checkAuthentication(promise, cipher,
                                (promise1, cipher1, postEncryptionCallback1) -> {
                                    GCMParameterSpec gcmSpec = cipher1.getParameters()
                                            .getParameterSpec(GCMParameterSpec.class);
                                    return createEncryptedItem(
                                            promise1,
                                            plaintextValue,
                                            cipher1,
                                            gcmSpec,
                                            postEncryptionCallback1);
                                },
                                postEncryptionCallback);
                    }
                });
            }
        }

        JSONObject createEncryptedItem(Promise promise, String plaintextValue, Cipher cipher,
                GCMParameterSpec gcmSpec, PostEncryptionCallback postEncryptionCallback)
                throws GeneralSecurityException, JSONException {

            byte[] plaintextBytes = plaintextValue.getBytes(StandardCharsets.UTF_8);
            byte[] ciphertextBytes = cipher.doFinal(plaintextBytes);
            String ciphertext = Base64.encodeToString(ciphertextBytes, Base64.NO_WRAP);

            String ivString = Base64.encodeToString(gcmSpec.getIV(), Base64.NO_WRAP);
            int authenticationTagLength = gcmSpec.getTLen();

            JSONObject result = new JSONObject()
                    .put(CIPHERTEXT_PROPERTY, ciphertext)
                    .put(IV_PROPERTY, ivString)
                    .put(GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY, authenticationTagLength);

            postEncryptionCallback.run(promise, result);

            return result;
        }

        @Override
        public void decryptItem(Promise promise, JSONObject encryptedItem, KeyStore.SecretKeyEntry secretKeyEntry,
                AuthenticationCallback callback) throws GeneralSecurityException, JSONException {

            String ciphertext = encryptedItem.getString(CIPHERTEXT_PROPERTY);
            String ivString = encryptedItem.getString(IV_PROPERTY);
            int authenticationTagLength = encryptedItem.getInt(GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY);
            byte[] ciphertextBytes = Base64.decode(ciphertext, Base64.DEFAULT);
            byte[] ivBytes = Base64.decode(ivString, Base64.DEFAULT);

            GCMParameterSpec gcmSpec = new GCMParameterSpec(authenticationTagLength, ivBytes);
            Cipher cipher = Cipher.getInstance(AES_CIPHER);
            cipher.init(Cipher.DECRYPT_MODE, secretKeyEntry.getSecretKey(), gcmSpec);

            callback.checkAuthentication(promise, cipher, (promise1, cipher1, postEncryptionCallback) -> {
                String result = new String(cipher1.doFinal(ciphertextBytes), StandardCharsets.UTF_8);
                promise1.resolve(result);
                return result;
            },
                    null);
        }
    }
}