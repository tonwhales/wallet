import React from "react";
import { memo, useCallback } from "react";
import { View, Text, Image } from "react-native";
import { t } from "../../../i18n/t";
import { RoundButton } from "../../../components/RoundButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { useDimensions } from "@react-native-community/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "../../../components/styles";
import { isNeocryptoAvailable } from "../../../utils/isNeocryptoAvailable";
import { ReceiveableSolanaAsset, ReceiveableTonAsset } from "../ReceiveFragment";

const EmptyIllustrations = {
    dark: require('@assets/empty-txs-dark.webp'),
    light: require('@assets/empty-txs.webp')
}

export enum TransactionsEmptyStateType {
    Ledger = 'ledger',
    Ton = 'ton',
    Solana = 'solana'
}

export type TransactionsEmptyParams = ({
    type: TransactionsEmptyStateType.Ledger,
    asset?: ReceiveableTonAsset
} | {
    type: TransactionsEmptyStateType.Ton
    asset?: ReceiveableTonAsset
} | {
    type: TransactionsEmptyStateType.Solana
    addr: string,
    asset?: ReceiveableSolanaAsset;
}) & {
    isWalletTab?: boolean
}

export const TransactionsEmptyState = memo((params: TransactionsEmptyParams) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const dimensions = useDimensions();
    const safeArea = useSafeAreaInsets();
    const showBuy = isNeocryptoAvailable();

    const navigateReceive = useCallback(() => {
        switch (params.type) {
            case TransactionsEmptyStateType.Ledger:
                navigation.navigateReceive({ addr: ledgerContext?.addr?.address, asset: params.asset }, !!ledgerContext?.addr);
                break;
            case TransactionsEmptyStateType.Ton:
                navigation.navigateReceive({ asset: params.asset });
                break;
            case TransactionsEmptyStateType.Solana:
                navigation.navigateSolanaReceive({ addr: params.addr, asset: params.asset });
                break;
        }

    }, [ledgerContext?.addr, params]);

    const minHeight = params.isWalletTab
        ? dimensions.window.height - safeArea.bottom - 112
        : undefined;

    const illContainerHeight = params.isWalletTab
        ? (dimensions.screen.width - 32) * 0.91
        : (dimensions.screen.width - 32) * 0.6;

    const illContainerWidth = dimensions.screen.width - 32;

    const illHeight = params.isWalletTab
        ? dimensions.window.height - safeArea.bottom - 112
        : (dimensions.window.height * 0.8) - safeArea.bottom - 112;

    const illWidth = params.isWalletTab
        ? dimensions.screen.width - 32
        : (dimensions.screen.width * 0.8) - 32;

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: 16,
            minHeight
        }}>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                width: illContainerWidth,
                height: illContainerHeight,
                borderRadius: 20, overflow: 'hidden',
                marginBottom: params.isWalletTab ? 32 : 16
            }}>
                <Image
                    resizeMode={'contain'}
                    style={{ height: illHeight, width: illWidth, marginTop: -20 }}
                    source={EmptyIllustrations[theme.style]}
                />
            </View>
            <Text style={[{ textAlign: 'center', color: theme.textPrimary }, params.isWalletTab ? Typography.semiBold32_38 : Typography.semiBold24_30]}>
                {t('wallet.empty.message')}
            </Text>
            <Text style={[{ marginTop: params.isWalletTab ? 16 : 4, textAlign: 'center', color: theme.textSecondary }, params.isWalletTab ? Typography.regular17_24 : Typography.regular15_20]}>
                {t('wallet.empty.description')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: params.isWalletTab ? 16 : 8 }}>
                <RoundButton
                    onPress={navigateReceive}
                    title={t('wallet.actions.receive')}
                    style={{ flex: 1, flexGrow: 1 }}
                />
                {(!network.isTestnet && params.type !== TransactionsEmptyStateType.Ledger) && showBuy && (
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