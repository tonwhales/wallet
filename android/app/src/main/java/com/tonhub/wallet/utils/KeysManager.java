package com.tonhub.wallet.utils;

import android.content.Context;
import org.json.JSONObject;
import org.json.JSONException;
import java.io.InputStream;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class KeysManager {
    private static JSONObject keysCache;

    public static JSONObject getKeys(Context context) throws IOException, JSONException {
        if (keysCache == null) {
            StringBuilder stringBuilder = new StringBuilder();
            try (InputStream inputStream = context.getAssets().open("keys.json");
                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    stringBuilder.append(line);
                }
            }

            keysCache = new JSONObject(stringBuilder.toString());
        }

        return keysCache;
    }

    public static String getIntercomApiKey(Context context) {
        try {
            return getKeys(context).getString("INTERCOM_API");
        } catch (Exception e) {
            e.printStackTrace();
            return "apiKey"; // Fallback value
        }
    }

    public static String getIntercomAppId(Context context) {
        try {
            return getKeys(context).getString("INTERCOM_APP");
        } catch (Exception e) {
            e.printStackTrace();
            return "appId"; // Fallback value
        }
    }
}
