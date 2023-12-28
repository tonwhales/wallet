import * as Haptics from 'expo-haptics';
import Clipboard from '@react-native-clipboard/clipboard';

export function copyText(text: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Clipboard.setString(text);
}