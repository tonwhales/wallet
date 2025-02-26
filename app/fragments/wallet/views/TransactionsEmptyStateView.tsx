import React from "react";
import { memo, useCallback } from "react";
import { View, Text, Image, useWindowDimensions } from "react-native";
import { t } from "../../../i18n/t";
import { RoundButton } from "../../../components/RoundButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "../../../components/styles";
import { isNeocryptoAvailable } from "../../../utils/isNeocryptoAvailable";

const EmptyIllustrations = {
    dark: require('@assets/empty-txs-dark.webp'),
    light: require('@assets/empty-txs.webp')
}

export const TransactionsEmptyState = memo(({ isLedger }: { isLedger?: boolean }) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const dimensions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const showBuy = isNeocryptoAvailable();

    const navigateReceive = useCallback(() => {
        navigation.navigateReceive({ addr: ledgerContext?.addr?.address }, isLedger && !!ledgerContext?.addr);
    }, [isLedger, ledgerContext?.addr]);

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, minHeight: dimensions.height - safeArea.bottom - 112 }}>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                width: dimensions.width - 32,
                height: (dimensions.width - 32) * 0.91,
                borderRadius: 20, overflow: 'hidden',
                marginBottom: 32,
            }}>
                <Image
                    resizeMode={'center'}
                    style={{ height: dimensions.width - 32, width: dimensions.width - 32, marginTop: -20 }}
                    source={EmptyIllustrations[theme.style]}
                />
            </View>
            <Text
                style={[{ textAlign: 'center', color: theme.textPrimary }, Typography.semiBold32_38]}
            >
                {t('wallet.empty.message')}
            </Text>
            <Text style={[{ marginTop: 16, textAlign: 'center', color: theme.textSecondary }, Typography.regular17_24]}>
                {t('wallet.empty.description')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 20 }}>
                <RoundButton
                    onPress={navigateReceive}
                    title={t('wallet.actions.receive')}
                    style={{ flex: 1, flexGrow: 1 }}
                />
                {(!network.isTestnet && !isLedger) && showBuy && (
                    <RoundButton
                        onPress={() => navigation.navigate('Buy')}
                        display={'secondary'}
                        title={t('wallet.actions.buy')}
                        style={{ flex: 1, flexGrow: 1, marginLeft: 16 }}
                    />
                )}
            </View>
        </View>
    )
});