import React from "react";
import { memo, useCallback } from "react";
import { Pressable, View, Text, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, avatarColors } from "../../../components/avatar/Avatar";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getAppState } from "../../../storage/appState";
import { resolveUrl } from "../../../utils/resolveUrl";
import { t } from "../../../i18n/t";
import { useLinkNavigator } from "../../../useLinkNavigator";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { useWalletSettings } from "../../../engine/hooks/appstate/useWalletSettings";
import { avatarHash } from "../../../utils/avatarHash";
import { Typography } from "../../../components/styles";
import { KnownWallets } from "../../../secure/KnownWallets";
import { Address } from "@ton/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { HeaderSyncStatus } from "./HeaderSyncStatus";

export const WalletHeader = memo(({ address }: { address: Address }) => {
    const network = useNetwork();
    const knownWallets = KnownWallets(network.isTestnet);
    const theme = useTheme();
    const bottomBarHeight = useBottomTabBarHeight();
    const linkNavigator = useLinkNavigator(network.isTestnet, { marginBottom: Platform.select({ ios: 16 + bottomBarHeight, android: 16 }) });
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const currentWalletIndex = getAppState().addresses.findIndex((w) => w.address.equals(address));
    const [walletSettings] = useWalletSettings(address);

    const avatarColorHash = walletSettings?.color ?? avatarHash(address.toString({ testOnly: network.isTestnet }), avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };
    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);

    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, []);

    return (
        <View
            style={{
                backgroundColor: theme.backgroundUnchangeable,
                paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                paddingHorizontal: 16
            }}
            collapsable={false}
        >
            <View style={{
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6
            }}>
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            flex: 1
                        }
                    }}
                    onPress={() => navigation.navigate('WalletSettings')}
                >
                    <View style={{
                        width: 32, height: 32,
                        backgroundColor: theme.accent,
                        borderRadius: 16
                    }}>
                        <Avatar
                            id={address.toString({ testOnly: network.isTestnet })}
                            size={32}
                            borderWidth={0}
                            hash={walletSettings?.avatar}
                            theme={theme}
                            knownWallets={knownWallets}
                            backgroundColor={avatarColor}
                        />
                    </View>
                </Pressable>
                <Pressable
                    onPress={onAccountPress}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: '30%' }}
                >
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                        height: 32, borderRadius: 32,
                        paddingHorizontal: 12, paddingVertical: 4,
                        alignItems: 'center'
                    }}>
                        <Text
                            style={[{
                                color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary,
                                flexShrink: 1,
                                marginRight: 8
                            }, Typography.semiBold17_24]}
                            ellipsizeMode='tail'
                            numberOfLines={1}
                        >
                            {walletSettings?.name || `${network.isTestnet ? '[test]' : ''} ${t('common.wallet')} ${currentWalletIndex + 1}`}
                        </Text>
                        <HeaderSyncStatus />
                    </View>
                </Pressable>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                            height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                            borderRadius: 16
                        })}
                        onPress={openScanner}
                    >
                        <Image
                            source={require('@assets/ic-scan-main.png')}
                            style={{
                                height: 22,
                                width: 22,
                                tintColor: theme.iconPrimary
                            }}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});

WalletHeader.displayName = 'WalletHeader';