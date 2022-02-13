import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleProp, ViewStyle, ToastAndroid, Platform, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { MenuView } from '@react-native-menu/menu';
import * as Haptics from 'expo-haptics';

export function CopyView(props: { content: string, children?: any, style?: StyleProp<ViewStyle> }) {

    const { t } = useTranslation();

    if (Platform.OS === 'android') {
        const onPress = React.useCallback(() => {
            Clipboard.setString(props.content);
            ToastAndroid.show(t('Copied to clipboard'), ToastAndroid.SHORT);
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
                { title: t('Copy'), id: 'copy' }
            ]}
            style={props.style}
        >
            {props.children}
        </MenuView>
    )
}