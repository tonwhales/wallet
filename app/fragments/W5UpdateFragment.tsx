import { Platform, View, Text, StyleSheet } from "react-native";
import { fragment } from "../fragment";
import { useNetwork, useTheme } from "../engine/hooks";
import { useSelectedAccount, useSetAppState } from "../engine/hooks/appstate";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { Typography } from "../components/styles";
import { RoundButton } from "../components/RoundButton";
import { useCallback } from "react";
import { contractFromPublicKey } from "../engine/contractFromPublicKey";
import { getAppState, markAddressSecured, setAppState } from "../storage/appState";
import { WalletVersions } from "../engine/types";

import W5Icon from '@assets/ic-w5-update.svg';
import USDTIcon from '@assets/ic-w5-usdt.svg';
import FeesIcon from '@assets/ic-w5-fees.svg';
import SeedIcon from '@assets/ic-w5-seed.svg';

export const W5UpdateFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selectedAccount = useSelectedAccount();
    const setAppState = useSetAppState();

    const addW5Wallet = useCallback(async () => {
        if (selectedAccount) {
            const contract = await contractFromPublicKey(selectedAccount.publicKey, WalletVersions.v5R1, isTestnet);
            const appState = getAppState();

            const newAppState = {
                addresses: [
                    ...appState.addresses,
                    {
                        address: contract.address,
                        publicKey: selectedAccount.publicKey,
                        secretKeyEnc: selectedAccount.secretKeyEnc,
                        utilityKey: selectedAccount.utilityKey,
                        addressString: contract.address.toString({ testOnly: isTestnet }),
                        version: WalletVersions.v5R1
                    }
                ],
                selected: appState.addresses.length
            }
            
            markAddressSecured(contract.address);
            setAppState(newAppState, isTestnet);

            navigation.navigateAndReplaceAll('Home');
        }
    }, [selectedAccount, setAppState]);

    return (
        <View style={{
            flexGrow: 1,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { marginTop: safeArea.top } })}
            />
            <View style={{ paddingHorizontal: 16 }}>
                <W5Icon width={196} height={108} style={styles.w5Icon} />

                <Text style={[{ color: theme.textPrimary, textAlign: 'center', marginBottom: 12, }, Typography.semiBold27_32]}>
                    {t('w5.update.title')}
                </Text>

                <View style={styles.paragraph}>
                    <Text style={[{ color: theme.textPrimary }, styles.subtitle, Typography.semiBold17_24]}>
                        {t('w5.update.subtitle_1')}
                    </Text>
                    <View style={styles.description}>
                        <USDTIcon width={24} height={24} style={styles.icon} />
                        <Text style={[{ color: theme.textSecondary, flex: 1 }, Typography.regular15_20]}>
                            {t('w5.update.description_1')}
                        </Text>
                    </View>
                </View>

                <View style={styles.paragraph}>
                    <Text style={[{ color: theme.textPrimary }, styles.subtitle, Typography.semiBold17_24]}>
                        {t('w5.update.subtitle_2')}
                    </Text>
                    <View style={styles.description}>
                        <FeesIcon width={24} height={24} style={styles.icon} />
                        <Text style={[{ color: theme.textSecondary, flex: 1 }, Typography.regular15_20]}>
                            {t('w5.update.description_2')}
                        </Text>
                    </View>
                </View>

                <View style={styles.paragraph}>
                    <Text style={[{ color: theme.textPrimary }, styles.subtitle, Typography.semiBold17_24]}>
                        {t('w5.update.subtitle_3')}
                    </Text>
                    <View style={styles.description}>
                        <SeedIcon width={24} height={24} style={styles.icon} />
                        <Text style={[{ color: theme.textSecondary, flex: 1 }, Typography.regular15_20]}>
                            {t('w5.update.description_3')}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ padding: 16 }}>
                <RoundButton
                    style={{ marginBottom: 16 }}
                    title={t('w5.update.switch_button')}
                    action={addW5Wallet}
                />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    paragraph: {
        paddingVertical: 12,
    },
    subtitle: {
        paddingLeft: 24 + 16,
    },
    description: {
        paddingTop: 2,
        flexDirection: 'row',
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 16,
        marginTop: 7,
    },
    w5Icon: {
        alignSelf: 'center',
        marginBottom: 24,
        marginTop: -2
    }
})