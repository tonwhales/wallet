/**
 * Push notification data from Maestra/Mindbox
 */
export interface MaestraPushData {
  uniq_push_key: string;
  notification_id: number;
  push_payload: string; // JSON string
  isOpenedFromPush: boolean;
  uniq_push_button_key: string | null;
  push_url: string;
}

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
export function isMaestraPushData(data: PushNotificationData): data is MaestraPushData {
  return 'uniq_push_key' in data && 'push_url' in data;
}

export function isExpoPushData(data: PushNotificationData): data is ExpoPushData {
  return 'projectId' in data && 'experienceId' in data;
}