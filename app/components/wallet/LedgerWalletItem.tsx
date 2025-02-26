import React, { memo, useCallback } from "react";
import { Pressable, View, Text, StyleSheet, Image, Alert } from "react-native";
import { t } from "../../i18n/t";
import { ellipsiseAddress } from "../address/WalletAddress";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Address } from "@ton/core";
import { useTheme } from "../../engine/hooks";
import { LedgerWallet, useLedgerTransport } from "../../fragments/ledger/components/TransportContext";

import IcCheck from "@assets/ic-check.svg";

interface Props {
    ledgerWallet: LedgerWallet;
    onSelect?: (address: Address) => void;
    selected: boolean;
    index: number;
}

export const LedgerWalletItem = memo(({ ledgerWallet, onSelect, selected, index }: Props) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();

    const handleSelectLedger = useCallback(() => {
        if (!!onSelect) {
            if (!!ledgerWallet) {
                try {
                    onSelect(Address.parse(ledgerWallet.address));
                } catch (error) {
                    Alert.alert(t('transfer.error.invalidAddress'));
                }
            } else {
                Alert.alert(t('transfer.error.invalidAddress'));
            }
            return;
        }
        ledgerContext.setAddr(ledgerWallet);
        navigation.navigateLedgerApp();
    }, [onSelect, ledgerWallet]);

    return (
        <Pressable
            style={[styles.pressable, { backgroundColor: theme.surfaceOnElevation }]}
            onPress={handleSelectLedger}
        >
            <View style={styles.imageContainer}>
                <Image
                    style={styles.image}
                    source={require('@assets/ledger_device.png')}
                />
            </View>
            <View style={styles.textContainer}>
                <Text
                    style={[styles.titleText, { color: theme.textPrimary }]}
                    numberOfLines={1}
                >
                    {t('hardwareWallet.ledger')} {index + 1}
                </Text>
                <Text style={styles.subtitleText}>
                    {ellipsiseAddress(ledgerWallet.address)}
                </Text>
            </View>
            <View
                style={[
                    styles.checkContainer,
                    { backgroundColor: selected ? theme.accent : theme.divider },
                ]}
            >
                {selected && (
                    <IcCheck color={'white'} height={16} width={16} style={styles.checkIcon} />
                )}
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    pressable: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    imageContainer: {
        height: 46,
        width: 46,
        borderRadius: 23,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: 46,
        height: 46,
    },
    textContainer: {
        justifyContent: 'center',
        flexGrow: 1,
        flexShrink: 1,
    },
    titleText: {
        fontSize: 17,
        lineHeight: 24,
        fontWeight: '600',
        marginBottom: 2,
        maxWidth: '90%',
    },
    subtitleText: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '400',
        color: '#838D99',
    },
    checkContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 24,
        width: 24,
        borderRadius: 12,
    },
    checkIcon: {
        height: 16,
        width: 16,
    },
});
