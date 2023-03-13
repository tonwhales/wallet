import React from "react";
import { View, Text, Image, Pressable, Platform, ToastAndroid } from "react-native";
import { AppConfig } from "../../AppConfig";
import { LockupWallet } from "../../engine/sync/startLockupWalletSync";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { ItemDivider } from "../ItemDivider";
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import CopyIcon from '../../../assets/ic_copy.svg';

export const AllowedAddresses = React.memo(({ wallet }: { wallet: LockupWallet }) => {
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
        <>
            {wallet.allowedDestinations.map((owner, index) => {
                const friendly = owner.toFriendly({ testOnly: AppConfig.isTestnet });
                return (
                    <Pressable
                        key={`wallet-${index}`}
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                            }
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <View style={{ height: 30, flexDirection: 'row' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: Theme.textSecondary, alignSelf: 'center', flexGrow: 1, flexBasis: 0 }}>
                                        {t('common.walletAddress')}
                                    </Text>
                                </View>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center', justifyContent: 'center',
                                    paddingBottom: 14
                                }}>
                                    <Text
                                        style={[
                                            {
                                                fontSize: 16,
                                                fontWeight: '400',
                                                color: Theme.textColor,
                                            },
                                        ]}
                                        selectable={false}
                                        numberOfLines={1}
                                    >
                                        {friendly.slice(0, 8)
                                            + '...'
                                            + friendly.slice(friendly.length - 6)}
                                    </Text>
                                    <View style={{
                                        flexGrow: 1,
                                        marginRight: 8,
                                    }} />
                                    <Pressable
                                        style={({ pressed }) => {
                                            return {
                                                opacity: pressed ? 0.3 : 1,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                // height: 30,
                                            };
                                        }}
                                        hitSlop={10}
                                        onPress={() => onCopy(owner.toFriendly({ testOnly: AppConfig.isTestnet }))}
                                    >
                                        <CopyIcon />
                                    </Pressable>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: 14
                                }}>
                                    <View style={{
                                        backgroundColor: Theme.accent,
                                        width: 30, height: 30,
                                        borderRadius: 15,
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Image source={require('../../../assets/ic_send.png')} />
                                    </View>
                                    <Text style={{
                                        fontSize: 13,
                                        color: Theme.accentText,
                                        marginTop: 4,
                                        fontWeight: '400'
                                    }}>
                                        {t('wallet.actions.send')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        {index < (wallet.allowedDestinations.length ?? 0) - 1 && (
                            <ItemDivider />
                        )}
                    </Pressable>
                );
            })}
        </>
    );
});