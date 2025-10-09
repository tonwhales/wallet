import { Platform, Share } from 'react-native';

/**
 * Share links and transactions
 * @param value - URL or text to share
 * @param title - Share title
 */
export function share(value: string, title: string) {
    if (Platform.OS === 'ios') {
        Share.share({ title, url: value });
    } else {
        Share.share({ title, message: value });
    }
}

