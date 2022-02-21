import * as React from 'react';
import { Pressable, StyleProp, ViewStyle, ToastAndroid, Platform, View, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { MenuView } from '@react-native-menu/menu';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n/t';
import { AppConfig } from '../AppConfig';

export function ActionsMenuView(props: { content: string, title?: string, children?: any, style?: StyleProp<ViewStyle> }) {

    const link = (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')
        + props.content;

    const onShare = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: link });
        } else {
            Share.share({ title: t('receive.share.title'), message: link });
        }
    }, []);

    return (
        <MenuView
            previewText={props.content}
            shouldOpenOnLongPress
            onPressAction={({ nativeEvent }) => {
                if (nativeEvent.event === 'copy') {
                    if (Platform.OS === 'android') {
                        Clipboard.setString(props.content);
                        ToastAndroid.show(t('common.copied'), ToastAndroid.SHORT);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        return;
                    }
                    Clipboard.setString(props.content);
                }
                if (nativeEvent.event === 'share') {
                    onShare();
                }
            }}
            actions={[
                { title: t('common.copy'), id: 'copy', image: Platform.OS === 'ios' ? 'doc.on.doc' : undefined },
                { title: t('common.share'), id: 'share', image: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
            ]}
            style={props.style}
            blurBackground
        >
            {props.children}
        </MenuView>
    )
}