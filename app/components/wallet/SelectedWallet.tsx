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
import { getAppState } from "../../storage/appState";
import { avatarHash } from "../../utils/avatarHash";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/ton";
import { t } from "../../i18n/t";

export const SelectedWallet = memo(({ onLightBackground, ledgerName }: { onLightBackground?: boolean, ledgerName?: string }) => {
    const network = useNetwork();
    const knownWallets = KnownWallets(network.isTestnet);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const isLedger = !!ledgerName;
    const ledgerContext = useLedgerTransport();
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : (selected?.address || getAppState().addresses?.[0]?.address);
    const currentWalletIndex = getAppState().addresses.findIndex((w) => w.address.equals(address));
    const [walletSettings] = useWalletSettings(address);

    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, []);

    if (!address) {
        return null;
    }

    const avatarColorHash = walletSettings?.color ?? avatarHash(address.toString({ testOnly: network.isTestnet }), avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const walletName = walletSettings?.name || ledgerName || `${network.isTestnet ? '[test] ' : ''}${t('common.wallet')} ${currentWalletIndex + 1}`;

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', flex: 1, alignItems: 'center' }}>
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                    }
                }}
                onPress={() => navigation.navigate(ledgerName ? 'LedgerWalletSettings' : 'WalletSettings')}
            >
                <View style={{
                    width: 48, height: 48,
                    backgroundColor: theme.accent,
                    borderRadius: 24,
                    marginRight: 12
                }}>
                    <Avatar
                        id={address.toString({ testOnly: network.isTestnet })}
                        size={48}
                        borderWidth={0}
                        hash={walletSettings?.avatar}
                        theme={theme}
                        knownWallets={knownWallets}
                        backgroundColor={avatarColor}
                        isLedger={isLedger}
                    />
                    <View style={{ position: 'absolute', top: -1, right: -1 }}>
                        <HeaderSyncStatus size={12} isLedger={isLedger} />
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
                        {walletName}
                    </Text>
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