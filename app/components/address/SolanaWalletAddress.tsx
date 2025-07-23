import React, { memo, useCallback } from "react";
import { NativeSyntheticEvent, Platform, Pressable, StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from "react-native";
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { t } from "../../i18n/t";
import { copyText } from "../../utils/copyText";
import { ToastDuration, ToastProps, useToaster } from "../toast/ToastProvider";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import CopyIcon from '@assets/ic-copy.svg';
import { getAddressName } from "../../utils/getAddressName";
import { AddressNameType } from "../../engine/types";

export function ellipsiseAddress(src: string, params?: { start?: number, end?: number }) {
    return src.slice(0, params?.start ?? 10)
        + '...'
        + src.slice(src.length - (params?.end ?? 6))
}

export const SolanaWalletAddress = memo((props: {
    address: string,
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
    withCopyIcon?: boolean,
    addressNameType?: AddressNameType,
}) => {
    const toaster = useToaster();
    const theme = useTheme();
    const { address, value, copyToastProps } = props;

    // TODO: add share and copy
    // const addressLink = useMemo(() => {
    //     return (network.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')
    //         + (props.value ? props.value : friendlyAddress);
    // }, [props.value, props.address]);

    // const onShare = useCallback(() => {
    //     if (Platform.OS === 'ios') {
    //         Share.share({ title: t('receive.share.title'), url: addressLink });
    //     } else {
    //         Share.share({ title: t('receive.share.title'), message: addressLink });
    //     }
    // }, [addressLink]);

    const onCopy = useCallback(() => {
        const text = props.value ? props.value : address;
        copyText(text);

        toaster.show(
            {
                message: getAddressName(props.addressNameType) + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT,
                ...props.copyToastProps
            }
        );
    }, [value, address, toaster, copyToastProps, props.addressNameType]);

    const handleAction = useCallback((e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
        switch (e.nativeEvent.name) {
            case t('common.copy'): {
                onCopy();
                break;
            }
            // case t('common.share'): {
            //     onShare();
            //     break;
            // }
            // case t('spamFilter.blockConfirm'): {
            //     onMarkAddressSpam(props.address);
            //     break;
            // }
            // case t('contacts.contact'): {
            //     onAddressContact(props.address)
            //     break;
            // }
            default:
                break;
        }
    }, [address]);

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
            {!props.disableContextMenu ? (
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
                                        textAlign: 'center',
                                        color: theme.textPrimary,
                                        fontVariant: ['tabular-nums'],
                                    },
                                    Typography.semiBold17_24,
                                    props.textStyle
                                ]}
                                selectable={false}
                                ellipsizeMode={'middle'}
                                {...props.textProps}
                            >
                                {ellipsiseAddress(address, typeof props.elipsise === 'boolean' ? undefined : props.elipsise)}
                            </Text>
                        ) : (
                            <>
                                <Text
                                    style={[
                                        { textAlign: 'center', color: theme.textPrimary },
                                        Typography.regular17_24,
                                        props.textStyle
                                    ]}
                                    selectable={false}
                                    ellipsizeMode={'middle'}
                                    {...props.textProps}
                                    numberOfLines={1}
                                >
                                    {address.slice(0, address.length / 2)}
                                </Text>
                                <Text
                                    style={[
                                        { textAlign: 'center', color: theme.textPrimary },
                                        Typography.regular17_24,
                                        props.textStyle
                                    ]}
                                    selectable={false}
                                    ellipsizeMode={'middle'}
                                    {...props.textProps}
                                    numberOfLines={1}
                                >
                                    {address.slice(address.length / 2, address.length)}
                                </Text>
                            </>
                        )}
                    </View>
                </ContextMenu>
            ) : (
                <Pressable
                    style={({ pressed }) => {
                        return [
                            props.style,
                            { opacity: (pressed && props.copyOnPress) ? 0.5 : 1, flexDirection: 'row', alignItems: 'center' }
                        ]
                    }}
                    onPress={props.copyOnPress ? onCopy : undefined}
                >
                    {props.elipsise ? (
                        <Text
                            style={[
                                {
                                    textAlign: 'center',
                                    color: theme.textPrimary,
                                    fontVariant: ['tabular-nums'],
                                },
                                Typography.semiBold17_24,
                                props.textStyle
                            ]}
                            selectable={false}
                            ellipsizeMode={'middle'}
                            {...props.textProps}
                        >
                            {ellipsiseAddress(address, typeof props.elipsise === 'boolean' ? undefined : props.elipsise)}
                        </Text>
                    ) : (
                        <>
                            <Text
                                style={[
                                    { textAlign: 'center', color: theme.textPrimary },
                                    Typography.regular17_24,
                                    props.textStyle
                                ]}
                                selectable={false}
                                ellipsizeMode={'middle'}
                                {...props.textProps}
                                numberOfLines={1}
                            >
                                {address.slice(0, address.length / 2)}
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
                                {address.slice(address.length / 2, address.length)}
                            </Text>
                        </>
                    )}
                    {props.withCopyIcon && (
                        <CopyIcon style={{ height: 12, width: 12, marginLeft: 12 }} height={12} width={12} color={theme.iconPrimary} />
                    )}
                </Pressable>
            )}
        </>
    );
});

SolanaWalletAddress.displayName = 'SolanaWalletAddress';