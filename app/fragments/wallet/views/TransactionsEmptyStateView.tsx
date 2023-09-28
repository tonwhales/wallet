import { memo, useCallback } from "react";
import { View, Text, Platform } from "react-native";
import { t } from "../../../i18n/t";
import { useAppConfig } from "../../../utils/AppConfigContext";

import IcEmpty from '@assets/ic-history-empty.svg';
import { RoundButton } from "../../../components/RoundButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useLedgerTransport } from "../../ledger/components/LedgerTransportProvider";

export const TransactionsEmptyState = memo(({ isLedger }: { isLedger?: boolean }) => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();

    const navigateReceive = useCallback(() => {
        if (isLedger && !!ledgerContext?.addr) {
            navigation.navigate(
                'LedgerReceive',
                {
                    addr: ledgerContext.addr.address,
                    ledger: true
                }
            );
            return;
        }

        navigation.navigate('Receive');
    }, [isLedger, ledgerContext]);

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
            <IcEmpty
                height={68}
                width={68}
                style={{
                    height: 68,
                    width: 68,
                    marginBottom: 32,
                }}
            />
            <Text
                style={{
                    textAlign: 'center',
                    fontSize: 32, fontWeight: '600',
                    color: Theme.textPrimary
                }}
            >
                {t('wallet.empty.message')}
            </Text>
            <Text
                style={{
                    marginTop: 16,
                    textAlign: 'center',
                    fontSize: 17, fontWeight: '400',
                    color: Theme.textSecondary
                }}
            >
                {t('wallet.empty.description')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 20 }}>
                <RoundButton
                    onPress={navigateReceive}
                    title={t('wallet.actions.receive')}
                    style={{ flex: 1, flexGrow: 1 }}
                />
                {(!AppConfig.isTestnet && Platform.OS === 'android' && !isLedger) && (
                    <RoundButton
                        onPress={() => navigation.navigate('Buy')}
                        display={'secondary'}
                        title={t('wallet.actions.buy')}
                        style={{ flex: 1, flexGrow: 1, marginRight: 16 }}
                    />
                )}
            </View>
        </View>
    )
});