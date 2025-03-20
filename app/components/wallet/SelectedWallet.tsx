import React from "react";
import { memo, useCallback } from "react";
import { Pressable, View, Text, Image } from "react-native";
import ArrowDown from '@assets/ic-arrow-down.svg';
import { Typography } from "../styles";
import { useNetwork, useSelectedAccount, useTheme, useWalletSettings } from "../../engine/hooks";
import { KnownWallets } from "../../secure/KnownWallets";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Avatar, avatarColors } from "../avatar/Avatar";
import { HeaderSyncStatus } from "../../fragments/wallet/views/HeaderSyncStatus";
import { WalletAddress } from "../address/WalletAddress";
import { getAppState } from "../../storage/appState";
import { avatarHash } from "../../utils/avatarHash";
import { useTranslation } from "react-i18next";

export const SelectedWallet = memo(({ onLightBackground, ledgerName }: { onLightBackground?: boolean, ledgerName?: string }) => {
    const network = useNetwork();
    const knownWallets = KnownWallets(network.isTestnet);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const selected = useSelectedAccount();
    const address = selected!.address || getAppState().addresses[0].address;

    const currentWalletIndex = getAppState().addresses.findIndex((w) => w.address.equals(address));
    const [walletSettings] = useWalletSettings(address);

    const avatarColorHash = walletSettings?.color ?? avatarHash(address.toString({ testOnly: network.isTestnet }), avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, []);

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', flex: 1, alignItems: 'center' }}>
            <Pressable
                disabled={!!ledgerName}
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                    }
                }}
                onPress={() => navigation.navigate('WalletSettings')}
            >
                <View style={{
                    width: 48, height: 48,
                    backgroundColor: theme.accent,
                    borderRadius: 24,
                    marginRight: 12
                }}>
                    {ledgerName ? (
                        <Image
                            style={{ width: 48, height: 48 }}
                            source={require('@assets/ledger_device.png')}
                        />
                    ) : (
                        <Avatar
                            id={address.toString({ testOnly: network.isTestnet })}
                            size={48}
                            borderWidth={0}
                            hash={walletSettings?.avatar}
                            theme={theme}
                            knownWallets={knownWallets}
                            backgroundColor={avatarColor}
                        />
                    )}
                    <View style={{ position: 'absolute', top: -1, right: -1 }}>
                        <HeaderSyncStatus size={12} isLedger={!!ledgerName}/>
                    </View>
                </View>
            </Pressable>
            <Pressable
                onPress={onAccountPress}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginLeft: 4, flexDirection: 'row', alignItems: 'center', gap: 4 })}
            >
                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Text
                        style={[{
                            color: onLightBackground ? theme.textPrimary : theme.textOnsurfaceOnDark,
                            marginRight: 8,
                        }, Typography.semiBold15_20]}
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    >
                        {ledgerName || walletSettings?.name || `${network.isTestnet ? '[test] ' : ''}${t('common.wallet')} ${currentWalletIndex + 1}`}
                    </Text>
                    {/* <WalletAddress
                        address={address}
                        elipsise={{ start: 4, end: 4 }}
                        textStyle={[Typography.regular13_18, {
                            color: onLightBackground ? theme.textPrimary : theme.textUnchangeable,
                            opacity: 0.5,
                            fontFamily: undefined,
                        }]}
                        disableContextMenu
                        theme={theme}
                    /> */}
                </View>
                <ArrowDown
                    height={16}
                    width={16}
                    color={onLightBackground ? theme.textPrimary : theme.iconUnchangeable}
                />
            </Pressable>
        </View>
    );
});

SelectedWallet.displayName = 'SelectedWallet';