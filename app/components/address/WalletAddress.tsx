import React, { memo, useCallback, useMemo } from "react";
import { NativeSyntheticEvent, Platform, Pressable, Share, StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from "react-native";
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { t } from "../../i18n/t";
import { confirmAlert } from "../../utils/confirmAlert";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { copyText } from "../../utils/copyText";
import { ToastDuration, ToastProps, useToaster } from "../toast/ToastProvider";
import { useAddToDenyList, useNetwork, useBounceableWalletFormat, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";

export function ellipsiseAddress(src: string, params?: { start?: number, end?: number }) {
    return src.slice(0, params?.start ?? 10)
        + '...'
        + src.slice(src.length - (params?.end ?? 6))
}

export const WalletAddress = memo((props: {
    address: Address,
    value?: string,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    textProps?: TextProps,
    known?: boolean,
    spam?: boolean;
    elipsise?: boolean | { start?: number, end?: number },
    limitActions?: boolean,
    disableContextMenu?: boolean,
    previewBackgroundColor?: string,
    copyOnPress?: boolean,
    copyToastProps?: Omit<ToastProps, 'message' | 'type' | 'duration'>,
    bounceable?: boolean,
}) => {
    const toaster = useToaster();
    const network = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const addToDenyList = useAddToDenyList();
    const [bounceableFormat,] = useBounceableWalletFormat();
    const bounceable = useMemo(() => {
        if (props.bounceable === undefined) {
            return bounceableFormat;
        }
        return props.bounceable;
    }, [bounceableFormat, props.bounceable]);
    const friendlyAddress = props.address.toString({ testOnly: network.isTestnet, bounceable });

    const onMarkAddressSpam = useCallback(async (addr: Address) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            addToDenyList(addr);
        }
    }, [addToDenyList]);

    const onAddressContact = useCallback((addr: Address) => {
        navigation.replace('Contact', { address: addr.toString({ testOnly: network.isTestnet }) });
    }, []);

    const addressLink = useMemo(() => {
        return (network.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')
            + (props.value ? props.value : friendlyAddress);
    }, [props.value, props.address]);

    const onShare = useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: addressLink });
        } else {
            Share.share({ title: t('receive.share.title'), message: addressLink });
        }
    }, [addressLink]);

    const onCopy = useCallback(() => {
        const text = props.value ? props.value : friendlyAddress;
        copyText(text);

        toaster.show(
            {
                message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT,
                ...props.copyToastProps
            }
        );
    }, [props.value, props.address, toaster, props.copyToastProps, friendlyAddress]);

    const handleAction = useCallback((e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
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
    }, [props.address]);

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
        <>
            {!props.disableContextMenu && (
                <ContextMenu
                    actions={[
                        { title: t('common.copy'), systemIcon: Platform.OS === 'ios' ? 'doc.on.doc' : undefined },
                        { title: t('common.share'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                        ...(props.limitActions ? [] : actions)
                    ]}
                    onPress={handleAction}
                    style={props.style}
                    previewBackgroundColor={props.previewBackgroundColor ? props.previewBackgroundColor : theme.transparent}
                >
                    <View>
                        {props.elipsise ? (
                            <Text
                                style={[
                                    {
                                        fontSize: 16,
                                        fontWeight: '700',
                                        textAlign: 'center',
                                        color: theme.textPrimary,
                                        fontVariant: ['tabular-nums'],
                                    },
                                    props.textStyle
                                ]}
                                selectable={false}
                                ellipsizeMode={'middle'}
                                {...props.textProps}
                            >
                                {ellipsiseAddress(friendlyAddress, typeof props.elipsise === 'boolean' ? undefined : props.elipsise)}
                            </Text>
                        ) : (
                            <>
                                <Text
                                    style={[
                                        {
                                            fontSize: 16,
                                            fontWeight: '400',
                                            textAlign: 'center',
                                            color: theme.textPrimary,
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
                                            fontWeight: '400',
                                            textAlign: 'center',
                                            color: theme.textPrimary,
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
            )}
            {props.disableContextMenu && (
                <Pressable
                    style={({ pressed }) => {
                        return [
                            props.style,
                            { opacity: (pressed && props.copyOnPress) ? 0.5 : 1, }
                        ]
                    }}
                    onPress={props.copyOnPress ? onCopy : undefined}
                >
                    {props.elipsise ? (
                        <Text
                            style={[
                                {
                                    fontSize: 16,
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    color: theme.textPrimary,
                                    fontVariant: ['tabular-nums'],
                                },
                                props.textStyle
                            ]}
                            selectable={false}
                            ellipsizeMode={'middle'}
                            {...props.textProps}
                        >
                            {ellipsiseAddress(friendlyAddress, typeof props.elipsise === 'boolean' ? undefined : props.elipsise)}
                        </Text>
                    ) : (
                        <>
                            <Text
                                style={[
                                    {
                                        fontSize: 16,
                                        fontWeight: '400',
                                        textAlign: 'center',
                                        color: theme.textPrimary,
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
                                        fontWeight: '400',
                                        textAlign: 'center',
                                        color: theme.textPrimary,
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
                </Pressable>
            )}
        </>
    );
})