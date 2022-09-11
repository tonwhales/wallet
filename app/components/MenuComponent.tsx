import * as React from 'react';
import { StyleProp, ViewStyle, ToastAndroid, Platform, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n/t';
import { AppConfig } from '../AppConfig';

export function MenuComponent(props: {
    content: string,
    title?: string,
    children?: any,
    style?: StyleProp<ViewStyle>
    actions?: { title: string, id: string, image?: string, attributes?: { destructive: boolean }, onAction: (content: string) => void }[]
}) {
    const actions: MenuAction[] = (props.actions || []).map((a) => {
        return { title: a.title, id: a.id, image: a.image, attributes: a.attributes }
    });

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
                    return;
                }
                if (nativeEvent.event === 'share') {
                    onShare();
                    return;
                }
                const action = props.actions?.find((a) => a.id === nativeEvent.event);
                if (!!action) {
                    action.onAction(props.content)
                }
            }}
            actions={[
                { title: t('common.copy'), id: 'copy', image: Platform.OS === 'ios' ? 'doc.on.doc' : undefined },
                { title: t('common.share'), id: 'share', image: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                ...actions
            ]}
            style={props.style}
            blurBackground
        >
            {props.children}
        </MenuView>
    )
}