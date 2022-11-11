import React, { useCallback, useMemo } from "react";
import { NativeSyntheticEvent, Platform, Share, StyleProp, Text, TextProps, TextStyle, ToastAndroid, View, ViewStyle } from "react-native";
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { AppConfig } from "../AppConfig";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useEngine } from "../engine/Engine";
import { confirmAlert } from "../utils/confirmAlert";
import { Address } from "ton";
import { useTypedNavigation } from "../utils/useTypedNavigation";

function ellipsiseAddress(src: string) {
    return src.slice(0, 6)
        + '...'
        + src.slice(src.length - 8)
}

export const WalletAddress = React.memo((props: {
    address: Address,
    value?: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps,
    known?: boolean,
    spam?: boolean;
    elipsise?: boolean
}) => {
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const settings = engine.products.settings;
    const friendlyAddress = props.address.toFriendly({ testOnly: AppConfig.isTestnet });

    const onMarkAddressSpam = React.useCallback(async (addr: Address) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            settings.addToDenyList(addr);
        }
    }, []);

    const onAddressContact = React.useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toFriendly({ testOnly: AppConfig.isTestnet }) });
    }, []);

    const addressLink = useMemo(() => {
        return (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')
            + (props.value ? props.value : props.address.toFriendly({ testOnly: AppConfig.isTestnet }));
    }, [props.value, props.address]);

    const onShare = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: addressLink });
        } else {
            Share.share({ title: t('receive.share.title'), message: addressLink });
        }
    }, [addressLink]);

    const onCopy = React.useCallback(() => {
        if (Platform.OS === 'android') {
            Clipboard.setString(props.value ? props.value : props.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            ToastAndroid.show(t('common.copied'), ToastAndroid.SHORT);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }
        Clipboard.setString(props.value ? props.value : props.address.toFriendly({ testOnly: AppConfig.isTestnet }));
        return;
    }, [props.value, props.address]);

    const handleAction = useCallback(
        (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
            switch (e.nativeEvent.name) {
                case t('common.copy'): {
                    onCopy();
                    break;
                }
                case t('common.share'): {
                    onShare();
                    break;
                }
                case t('spamFilter.blockConfirm'): {
                    onMarkAddressSpam(props.address);
                    break;
                }
                case t('contacts.contact'): {
                    onAddressContact(props.address)
                    break;
                }
                default:
                    break;
            }
        },
        [],
    );

    const actions: ContextMenuAction[] = [];

    if (!props.spam) {
        actions.push({
            title: t('spamFilter.blockConfirm'),
            systemIcon: Platform.OS === 'ios' ? 'exclamationmark.octagon' : undefined,
            destructive: true,
        });
    }

    if (!props.known) {
        actions.push({
            title: t('contacts.contact'),
            systemIcon: Platform.OS === 'ios' ? 'person.crop.circle' : undefined,
        });
    }

    return (
        <ContextMenu
            actions={[
                { title: t('common.copy'), systemIcon: Platform.OS === 'ios' ? 'doc.on.doc' : undefined },
                { title: t('common.share'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                ...actions
            ]}
            onPress={handleAction}
            style={props.style}
        >
            <View>
                {props.elipsise && (
                    <Text
                        style={[
                            {
                                fontSize: 16,
                                fontWeight: '700',
                                textAlign: 'center',
                                color: Theme.textColor,
                                fontVariant: ['tabular-nums'],
                            },
                            props.textStyle
                        ]}
                        selectable={false}
                        ellipsizeMode={'middle'}
                        {...props.textProps}
                    >
                        {ellipsiseAddress(friendlyAddress)}
                    </Text>
                )}
                {!props.elipsise && (
                    <>
                        <Text
                            style={[
                                {
                                    fontSize: 16,
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    color: Theme.textColor,
                                    fontVariant: ['tabular-nums'],
                                    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
                                },
                                props.textStyle
                            ]}
                            selectable={false}
                            ellipsizeMode={'middle'}
                            {...props.textProps}
                            numberOfLines={1}
                        >
                            {friendlyAddress.slice(0, friendlyAddress.length / 2)}
                        </Text>
                        <Text
                            style={[
                                {
                                    fontSize: 16,
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    color: Theme.textColor,
                                    fontVariant: ['tabular-nums'],
                                    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
                                },
                                props.textStyle
                            ]}
                            selectable={false}
                            ellipsizeMode={'middle'}
                            {...props.textProps}
                            numberOfLines={1}
                        >
                            {friendlyAddress.slice(friendlyAddress.length / 2, friendlyAddress.length)}
                        </Text>
                    </>
                )}
            </View>
        </ContextMenu>
    );
})