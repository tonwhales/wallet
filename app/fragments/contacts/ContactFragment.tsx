import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, Image, Pressable } from "react-native";
import Animated, { } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContactField } from "../../components/Contacts/ContactField";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { copyText } from "../../utils/copyText";
import { ItemDivider } from "../../components/ItemDivider";
import Share from 'react-native-share';
import { ToastDuration, useToaster } from "../../components/toast/ToastProvider";
import { useBounceableWalletFormat, useContact, useNetwork, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { useContractInfo } from "../../engine/hooks/metadata/useContractInfo";
import { requiredFields } from "./ContactNewFragment";
import { ContactEdit } from "../../components/Contacts/ContactEdit";
import { Avatar } from "../../components/avatar/Avatar";
import { KnownWallets } from "../../secure/KnownWallets";
import { Typography } from "../../components/styles";
import { AssetViewType } from "../wallet/AssetsFragment";

import CopyIcon from '@assets/ic-copy.svg';
import ShareIcon from '@assets/ic-share-contact.svg';

export const ContactFragment = fragment(() => {
    const toaster = useToaster();
    const params = useParams<{ address: string }>();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);

    const [address, setAddress] = useState(params.address ?? '');
    const parsed = useMemo(() => {
        try {
            return Address.parseFriendly(address);
        } catch {
            return null;
        }
    }, [address]);

    const safeArea = useSafeAreaInsets();
    const contact = useContact(params.address);
    const contractInfo = useContractInfo(params.address ?? '');

    const [bounceableFormat] = useBounceableWalletFormat();
    const [editing, setEditing] = useState(!contact);
    const name = contact?.name ?? '';
    const fields = contact?.fields ?? requiredFields;

    const shortAddressStr = useMemo(() => {
        if (!parsed) {
            return null;
        }
        const bounceable = (contractInfo?.kind === 'wallet')
            ? bounceableFormat
            : true;
        const friendly = parsed.address.toString({ testOnly: isTestnet, bounceable });
        return `${friendly.slice(0, 6) + '...' + friendly.slice(friendly.length - 6)}`;
    }, [contractInfo, bounceableFormat, parsed, isTestnet, editing]);

    const onCopy = useCallback(() => {
        if (!parsed) {
            return;
        }
        copyText(parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }));

        toaster.show(
            {
                message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT,
            }
        );
    }, [parsed]);

    const onShare = useCallback(() => {
        if (!parsed) {
            return;
        }
        Share.open({
            title: t('contacts.title'),
            message: `${name} \n${parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable })}`
        });
    }, [parsed]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('contacts.title')}
                style={{ paddingLeft: 16 }}
                onClosePressed={navigation.goBack}
            />
            {editing ? (
                <ContactEdit
                    address={address}
                    onDeleted={navigation.goBack}
                    isTestnet={isTestnet}
                    onSaved={() => setEditing(false)}
                    theme={theme}
                    knownWallets={knownWallets}
                />
            ) : (
                <>
                    <Animated.ScrollView
                        style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                        contentInset={{
                            bottom: 0.1 /* Some weird bug on iOS */,
                            top: 0.1 /* Some weird bug on iOS */
                        }}
                        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                        automaticallyAdjustContentInsets={false}
                        scrollEventThrottle={16}
                        contentInsetAdjustmentBehavior={'never'}
                        keyboardShouldPersistTaps={'always'}
                        keyboardDismissMode={'none'}
                    >
                        <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                            <View style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%'
                            }}>
                                <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 0, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                                    <Avatar
                                        address={parsed ? parsed.address.toString({ testOnly: isTestnet }) : ''}
                                        id={parsed ? parsed.address.toString({ testOnly: isTestnet }) : ''}
                                        size={100}
                                        image={undefined}
                                        borderWith={2}
                                        borderColor={theme.surfaceOnElevation}
                                        theme={theme}
                                        knownWallets={knownWallets}
                                        hashColor
                                    />
                                </View>
                                <Text style={[{ color: theme.textPrimary, marginTop: 16 }, Typography.semiBold32_38]}>
                                    {name}
                                </Text>
                                <Pressable
                                    onPress={onCopy}
                                    style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <Text style={[{ marginTop: 4, color: theme.textSecondary }, Typography.regular17_24]}>
                                        {shortAddressStr}
                                    </Text>
                                    <CopyIcon style={{ height: 12, width: 12, marginLeft: 12 }} height={12} width={12} color={theme.iconPrimary} />
                                </Pressable>
                                {!!parsed && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            marginTop: 24,
                                            backgroundColor: theme.surfaceOnElevation,
                                            width: '100%',
                                            justifyContent: 'center', alignItems: 'center',
                                            borderRadius: 20,
                                            padding: 10
                                        }}
                                    >
                                        <Pressable
                                            onPress={() => navigation.navigateAssets({
                                                target: parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }),
                                                viewType: AssetViewType.Transfer
                                            })}
                                            style={({ pressed }) => ({
                                                opacity: pressed ? 0.5 : 1,
                                                borderRadius: 14,
                                                padding: 10,
                                                flexGrow: 1
                                            })}
                                        >
                                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                                <View
                                                    style={{
                                                        backgroundColor: theme.accent,
                                                        width: 32, height: 32,
                                                        borderRadius: 16,
                                                        alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                    <Image source={require('@assets/ic_send.png')} />
                                                </View>
                                                <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.semiBold15_20]}>
                                                    {t('wallet.actions.send')}
                                                </Text>
                                            </View>
                                        </Pressable>
                                        <Pressable
                                            onPress={onShare}
                                            style={({ pressed }) => {
                                                return { opacity: pressed ? 0.5 : 1, borderRadius: 14, padding: 10, flexGrow: 1 }
                                            }}
                                        >
                                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                                <View
                                                    style={{
                                                        backgroundColor: theme.accent,
                                                        width: 32, height: 32,
                                                        borderRadius: 16,
                                                        alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                    <ShareIcon height={24} width={24} color={'white'} style={{ height: 12, width: 12 }} />
                                                </View>
                                                <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}>
                                                    {t('common.share')}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    </View>
                                )}
                                {(fields.filter((f) => (f.value?.length ?? 0) > 0).length > 0) && (
                                    <View style={{
                                        backgroundColor: theme.surfaceOnElevation,
                                        marginTop: 20,
                                        paddingVertical: 20,
                                        width: '100%', borderRadius: 20
                                    }}>
                                        {fields
                                            .filter((f) => (f.value?.length ?? 0) > 0)
                                            .map((field, index) => {
                                                return (
                                                    <View key={`input-${index}`}>
                                                        <ContactField
                                                            fieldKey={field.key}
                                                            index={index + 1}
                                                            input={{
                                                                value: field.value || '',
                                                                editable: false,
                                                                enabled: false
                                                            }}
                                                        />
                                                        {index !== fields.filter((f) => (f.value?.length ?? 0) > 0).length - 1 && (
                                                            <ItemDivider marginHorizontal={0} />
                                                        )}
                                                    </View>
                                                )
                                            })
                                        }
                                    </View>
                                )}
                            </View>
                        </View>
                    </Animated.ScrollView>
                    <View
                        style={{
                            position: 'absolute', bottom: safeArea.bottom + 24, left: 0, right: 0,
                            paddingHorizontal: 16,
                            gap: 16
                        }}
                    >
                        <RoundButton
                            display={'default'}
                            onPress={() => setEditing(true)}
                            title={t('contacts.edit')}
                        />
                    </View>
                </>
            )}
        </View>
    );
});