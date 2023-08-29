import * as React from 'react';
import { Platform, Pressable, Text, ToastAndroid, View } from 'react-native';
import VerifiedIcon from '../../assets/ic_verified.svg';
import ContactIcon from '../../assets/ic_contacts.svg';
import CopyIcon from '../../assets/ic_copy.svg';
import { t } from '../i18n/t';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../engine/hooks/useTheme';

export const ItemAddress = React.memo((props: {
    title: string,
    text?: string,
    secondary?: string,
    verified?: boolean,
    contact?: boolean,
    children?: any
}) => {
    const theme = useTheme();
    const onCopy = React.useCallback((body: string) => {
        if (Platform.OS === 'android') {
            Clipboard.setString(body);
            ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }
        Clipboard.setString(body);
        return;
    }, []);
    return (
        <View style={{ flexDirection: 'column', paddingHorizontal: 16, alignItems: 'flex-start' }}>
            <View style={{ height: 30, flexDirection: 'row' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textSecondary, alignSelf: 'center', flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
                <View style={{ alignItems: 'center', height: 30, flexDirection: 'row' }}>
                    {props.verified && !props.contact && (<VerifiedIcon />)}
                    {!props.verified && props.contact && (<ContactIcon />)}
                    {props.secondary && (<Text style={{ fontSize: 14, color: theme.textSecondary }}>{props.secondary}</Text>)}
                </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'column', paddingBottom: 4 }}>
                    {props.text && (
                        <View style={{ paddingBottom: 6 }}>
                            <>
                                <Text
                                    style={[
                                        {
                                            fontSize: 16,
                                            fontWeight: '400',
                                            color: theme.textColor,
                                        },
                                    ]}
                                    selectable={false}
                                    ellipsizeMode={'middle'}
                                    numberOfLines={1}
                                >
                                    {props.text.slice(0, props.text.length / 2)}
                                </Text>
                                <Text
                                    style={[
                                        {
                                            fontSize: 16,
                                            fontWeight: '400',
                                            color: theme.textColor,
                                        },
                                    ]}
                                    selectable={false}
                                    ellipsizeMode={'middle'}
                                    numberOfLines={1}
                                >
                                    {props.text.slice(props.text.length / 2, props.text.length)}
                                </Text>
                            </>
                        </View>
                    )}
                    {props.children}
                </View>
                {!!props.text && (
                    <>
                        <View style={{ flexGrow: 1 }} />
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.3 : 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 30,
                                };
                            }}
                            onPress={() => onCopy(props.text!)}
                        >
                            <CopyIcon />
                        </Pressable>
                    </>
                )}
            </View>
        </View>
    )
});