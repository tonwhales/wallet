import { Platform, Share } from 'react-native';

export function share(value: string, title: string) {
    if (Platform.OS === 'ios') {
        Share.share({ title, url: value });
    } else {
        Share.share({ title, message: value });
    }
}

