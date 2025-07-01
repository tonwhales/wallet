import { useCallback, useEffect } from 'react';
import MindboxSdk, { LogLevel } from 'mindbox-sdk';
import { PushNotificationData, isMaestraPushData, isExpoPushData } from '../../types';
import { handleLinkReceived } from '../../../utils/CachedLinking';
import { Platform, DeviceEventEmitter } from 'react-native';

export const usePushNotificationsInit = (initialPushData?: PushNotificationData) => {
    // Common function to handle push notification data
    const handlePushNotification = useCallback((data: PushNotificationData) => {
      // Using setTimeout to defer link processing to allow the Event Loop to complete current tasks
      // and ensure the app is fully initialized before handling the deeplink
      setTimeout(() => {
        let url: string | undefined;
  
        if (isMaestraPushData(data)) {
          if (data.push_url && typeof data.push_url === 'string') {
            url = data.push_url;
          } else if (data.push_payload) {
            try {
              const payloadData = JSON.parse(data.push_payload);
              if (payloadData.url && typeof payloadData.url === 'string') {
                url = payloadData.url;
              }
            } catch (e) {
              console.log('Error parsing Maestra push_payload:', e);
            }
          }
        } else if (isExpoPushData(data)) {
          if (data.body) {
            try {
              const bodyData = JSON.parse(data.body);
              if (bodyData.url && typeof bodyData.url === 'string') {
                url = bodyData.url;
              }
            } catch (e) {
              console.log('Error parsing Expo body:', e);
            }
          }
        }
  
        if (url) {
          handleLinkReceived(url);
        }
      }, 100);
    }, []);
  
    // Handle initial push data from cold start
    useEffect(() => {
      if (initialPushData) {
        handlePushNotification(initialPushData as PushNotificationData);
      }
    }, [initialPushData, handlePushNotification]);
  
    // This listener is used to handle push notifications from expo on Android
    // We handle intents from Expo and Maestra in the native code
    // And send data to the JS layer when user clicks on the notification
    // This is done because of the conflict between Maestra and Expo FCM services
    useEffect(() => {
      let pushNotificationListener = null;
      if (Platform.OS === 'android') {
        pushNotificationListener = DeviceEventEmitter.addListener(
          'pushNotificationOpened',
          (data: PushNotificationData) => {
            handlePushNotification(data);
          }
        );
      }
  
      return () => {
        pushNotificationListener?.remove();
      };
    }, [handlePushNotification]);
  
    const appInitializationCallback = useCallback(async () => {
      try {
        const configuration = {
          domain: 'api.maestra.io',
          endpointId:
            Platform.OS === 'ios'
              ? 'tonhub.IosApp'
              : 'tonhub.AndroidApp',
          subscribeCustomerIfCreated: true,
          shouldCreateCustomer: true,
  
        };
        await MindboxSdk.initialize(configuration);
        MindboxSdk.setLogLevel(LogLevel.DEBUG)
      } catch (error) {
        console.log('MINDBOX ERROR', error);
      }
    }, []);
  
    useEffect(() => {
      appInitializationCallback();
    }, [appInitializationCallback]);
  }