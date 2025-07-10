package com.tonhub.wallet.push;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.util.Log;

import androidx.annotation.NonNull;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * This class wraps multiple FirebaseMessagingService implementations
 * and makes sure each will be called appropriately.
 */
public class WrapperFirebaseMessagingService extends FirebaseMessagingService {

    private List<FirebaseMessagingService> messagingServices = new ArrayList<>();

    public WrapperFirebaseMessagingService() {
        // Add all the FirebaseMessagingServices you need here
        // @TODO: uncomment this when we start using Maestra
        // messagingServices.add(new com.tonhub.wallet.push.MaestraFirebaseMessagingService());
        messagingServices.add(new com.tonhub.wallet.push.ExpoFirebaseMessagingService());
    }

    //
    // Forward FirebaseMessagingService methods
    //

    @Override
    public void onNewToken(String s) {
        forward(service -> {
            service.onNewToken(s);
        });
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        forward(service -> {
            service.onMessageReceived(remoteMessage);
        });
    }

    @Override
    public void onDeletedMessages() {
        forward(FirebaseMessagingService::onDeletedMessages);
    }

    //
    // Forward Service methods
    //

    @Override
    public void onCreate() {
        forward(Service::onCreate);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        forward(service -> {
            service.onConfigurationChanged(newConfig);
        });
    }

    @Override
    public void onLowMemory() {
        forward(Service::onLowMemory);
    }

    @Override
    public void onTrimMemory(int level) {
        forward(service -> {
            service.onTrimMemory(level);
        });
    }

    @Override
    public boolean onUnbind(Intent intent) {
        final AtomicBoolean rtn = new AtomicBoolean(false);
        forward(service -> {
            if (service.onUnbind(intent)) {
                rtn.set(true);
            }
        });
        return rtn.get();
    }

    @Override
    public void onRebind(Intent intent) {
        forward(service -> {
            service.onRebind(intent);
        });
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        forward(service -> {
            service.onTaskRemoved(rootIntent);
        });
    }

    //
    // Wrapping code
    //

    private void forward(Forwarder action) {
        for (FirebaseMessagingService service : messagingServices) {
            action.run(service);
        }
    }

    interface Forwarder {
        void run(FirebaseMessagingService service);
    }

    // Give the context to wrapped services or they won't be able to call getApplicationContext() and the like,
    // and they will hence likely fail.
    @Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(newBase);

        // Accessing protected method Landroid/app/Service;->attachBaseContext(Landroid/content/Context;)V,public-api,sdk,system-api,test-api
        Method method;
        try {
            method = Service.class.getDeclaredMethod("attachBaseContext", Context.class);
        } catch (NoSuchMethodException ex) {
            Log.e(this.getClass().getSimpleName(), "Failed to reflect Service.attachBaseContext", ex);
            return;
        }

        boolean wasAccessible = method.isAccessible();
        if (!wasAccessible) method.setAccessible(true);

        // Forward attachBaseContext to the wrapped services too
        forward(service -> {
            try {
                method.invoke(service, newBase);
            } catch (IllegalAccessException ex) {
                Log.e(this.getClass().getSimpleName(), "Failed to invoke Service.attachBaseContext for " + service, ex);
            } catch (InvocationTargetException ex) {
                Log.e(this.getClass().getSimpleName(), "Got an error while invoking Service.attachBaseContext for " + service, ex);
            }
        });

        if (!wasAccessible) method.setAccessible(false);
    }

}