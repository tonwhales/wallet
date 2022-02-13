import * as React from 'react';
import { Pressable, StyleProp, ViewStyle, ToastAndroid, Platform, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { MenuView } from '@react-native-menu/menu';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n/t';

export function CopyView(props: { content: string, children?: any, style?: StyleProp<ViewStyle> }) {

    if (Platform.OS === 'android') {
        const onPress = React.useCallback(() => {
            Clipboard.setString(props.content);
            ToastAndroid.show(t('common.copied'), ToastAndroid.SHORT);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, [props.content]);
        return (
            <Pressable style={props.style} onLongPress={onPress}>
                {props.children}
            </Pressable>
        );
    }

    return (

        <MenuView
            onPressAction={({ nativeEvent }) => {
                if (nativeEvent.event === 'copy') {
                    Clipboard.setString(props.content);
                }
            }}
            actions={[
                { title: t('common.copy'), id: 'copy' }
            ]}
            style={props.style}
        >
            {props.children}
        </MenuView>
    )
}