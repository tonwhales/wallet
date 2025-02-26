import { memo, useCallback } from "react";
import { Pressable, View, Text, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { t } from "../../i18n/t";
import { ellipsiseAddress } from "../address/WalletAddress";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Address } from "@ton/core";
import { useAppState, useSetAppState, useTheme, useWalletSettings } from "../../engine/hooks";
import { avatarHash } from "../../utils/avatarHash";
import { KnownWallet } from "../../secure/KnownWallets";
import { Avatar, avatarColors } from "../avatar/Avatar";
import { Typography } from "../styles";
import { LinearGradient } from "expo-linear-gradient";

import IcCheck from "@assets/ic-check.svg";

export const WalletItem = memo((
    {
        index,
        address,
        selected,
        onSelect,
        style,
        hideSelect,
        bounceableFormat,
        isW5,
        isTestnet,
        knownWallets
    }: {
        index: number
        address: Address,
        selected?: boolean,
        onSelect?: (address: Address) => void
        style?: StyleProp<ViewStyle>,
        hideSelect?: boolean,
        bounceableFormat: boolean,
        isW5: boolean;
        isTestnet: boolean,
        knownWallets: { [key: string]: KnownWallet }
    }
) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const appState = useAppState();
    const updateAppState = useSetAppState();
    const [walletSettings] = useWalletSettings(address);

    const avatarColorHash = walletSettings?.color ?? avatarHash(address.toString({ testOnly: isTestnet }), avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const onSelectAccount = useCallback(() => {
        if (onSelect) {
            onSelect(address);
            return;
        }
        if (selected) {
            navigation.navigateAndReplaceAll('Home');
            return;
        };
        const index = appState.addresses.findIndex((a) => a.address.equals(address));

        if (index < 0) {
            return;
        }

        // Select new account
        updateAppState({ ...appState, selected: index }, isTestnet);

        navigation.navigateAndReplaceAll('Home');
    }, [walletSettings, selected, address, isTestnet, onSelect]);

    return (
        <Pressable
            style={[{
                backgroundColor: theme.surfaceOnElevation,
                padding: 20,
                marginBottom: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }, style]}
            onPress={onSelectAccount}
        >
            <View style={{
                height: 46, width: 46,
                backgroundColor: theme.accent,
                borderRadius: 23,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Avatar
                    borderWidth={0}
                    id={address.toString({ testOnly: isTestnet })}
                    size={46}
                    hash={walletSettings?.avatar}
                    theme={theme}
                    backgroundColor={avatarColor}
                    knownWallets={knownWallets}
                />
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text
                        style={[{
                            color: theme.textPrimary,
                            marginBottom: 2,
                            maxWidth: '90%',
                        }, Typography.semiBold17_24]}
                        numberOfLines={1}
                    >
                        {walletSettings?.name || `${t('common.wallet')} ${index + 1}`}
                    </Text>
                    {isW5 && (
                         <View style={[styles.label, { backgroundColor: theme.divider }]}>
                            <LinearGradient
                                style={styles.gradientW5}
                                colors={['#F54927', '#FAA046']}
                                start={[0, 1]}
                                end={[1, 0]}
                            />
                            <Text style={[{ color: theme.white }, Typography.medium13_18]}>
                                {'W5'}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={[{ color: '#838D99' }, Typography.regular15_20]}>
                    {ellipsiseAddress(address.toString({ testOnly: isTestnet, bounceable: bounceableFormat }))}
                </Text>
            </View>
            {!hideSelect && (
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    height: 24, width: 24,
                    backgroundColor: selected ? theme.accent : theme.divider,
                    borderRadius: 12
                }}>
                    {selected && (
                        <IcCheck color={'white'} height={16} width={16} style={{ height: 16, width: 16 }} />
                    )}
                </View>
            )}
        </Pressable>
    )
});


const styles = StyleSheet.create({
    label: {
        marginTop: 1,
        paddingHorizontal: 8,
        paddingVertical: 1,
        marginLeft: 8,
        borderRadius: 20,
        height: 20,
    },
    gradientW5: {
        position: 'absolute',
        borderRadius: 20,
        left: 0,
        top: 0,
        height: 20,
        width: 37,
    },
});