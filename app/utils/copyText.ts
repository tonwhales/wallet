import { Platform, ToastAndroid } from "react-native";
import * as Haptics from 'expo-haptics';
import Clipboard from '@react-native-clipboard/clipboard';
import { t } from "../i18n/t";

export function copyText(text: string) {
    if (Platform.OS === 'android') {
        Clipboard.setString(text);
        ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
    }
    // iOS
    Clipboard.setString(text);
    // TODO: iOS toast
}