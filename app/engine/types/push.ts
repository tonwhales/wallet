/**
 * Push notification data from Maestra/Mindbox
 */
export interface MaestraPushDataAndroid {
  uniq_push_key: string;
  notification_id: number;
  push_payload: string; // JSON string
  isOpenedFromPush: boolean;
  uniq_push_button_key: string | null;
  push_url: string;
}

export interface MaestraPushDataIOS {
  uniqueKey: string;
  payload: Record<string, any>;
  clickUrl: string;
  imageUrl: boolean;
  aps: {
    alert: {
      title: string;
      body: string;
    };
    'content-available': number;
    'mutable-content': number;
    sound: string;
  };
}

export type MaestraPushData = MaestraPushDataAndroid | MaestraPushDataIOS;

/**
 * Push notification data from Expo
 */
export interface ExpoPushData {
  projectId: string;
  experienceId: string;
  scopeKey: string;
  body: string; // JSON string
  title: string;
  message: string;
}

/**
 * Push notification data - either from Maestra or Expo
 */
export type PushNotificationData = MaestraPushData | ExpoPushData;

/**
 * Type guards to distinguish between push notification types
 */
export function isMaestraPushDataAndroid(data: PushNotificationData): data is MaestraPushDataAndroid {
  return 'uniq_push_key' in data && 'push_url' in data;
}

export function isMaestraPushDataIOS(data: Record<string, any>): data is MaestraPushDataIOS {
  return 'uniqueKey' in data && 'clickUrl' in data;
}

export function isExpoPushData(data: PushNotificationData): data is ExpoPushData {
  return 'projectId' in data && 'experienceId' in data;
}
