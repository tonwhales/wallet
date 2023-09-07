import React from "react";
import { Pressable, View, Text, ActivityIndicator } from "react-native";
import { ValueComponent } from "../../../components/ValueComponent";
import { t } from "../../../i18n/t";
import { LedgerAccount } from "../LedgerSelectAccountFragment";
import { useAppConfig } from "../../../utils/AppConfigContext";
import Chevron from '../../../../assets/ic-chevron-down.svg';


export const AccountButton = React.memo(({ acc, onSelect, loadingAcc }: { acc: LedgerAccount, onSelect: (acc: LedgerAccount) => Promise<any>, loadingAcc?: number }) => {
    const { Theme } = useAppConfig();
    const [loading, setLoading] = React.useState(false);
    const doAction = React.useCallback(() => {
        if (!!loadingAcc && loadingAcc !== acc.i) {
            return;
        }
        setLoading(true);
        (async () => {
            try {
                await onSelect(acc);
            } finally {
                setLoading(false);
            }
        })();
    }, [onSelect, acc, loadingAcc]);

    return (
        <Pressable onPress={doAction} style={({ pressed }) => {
            return {
                opacity: (pressed && loadingAcc === undefined) || (loadingAcc !== undefined && loadingAcc !== acc.i) ? 0.5 : 1
            };
        }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                backgroundColor: Theme.border,
                marginVertical: 8,
                borderRadius: 20,
            }}>
                {loading && (
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textColor
                        }}>
                            {t('hardwareWallet.actions.confirmOnLedger')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 15, lineHeight: 20,
                            color: Theme.textSecondary,
                        }}>
                            {t('hardwareWallet.connection')}
                        </Text>
                    </View>
                )}
                {!loading && (
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textColor
                        }}>
                            <ValueComponent
                                value={acc.balance}
                                precision={3}
                            />
                            {' TON'}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 15, lineHeight: 20,
                            color: Theme.textSecondary,
                        }}>
                            {acc.addr.address.slice(0, 6) + '...' + acc.addr.address.slice(acc.addr.address.length - 6)}
                        </Text>
                    </View>
                )}
                <View style={{ flexGrow: 1 }} />
                {loading ? (
                    <ActivityIndicator color={Theme.accent} size='small' />
                ) : (
                    <Chevron
                        height={16} width={16}
                        style={{
                            height: 16, width: 16,
                            transform: [{ rotate: '-90deg' }],
                        }}
                    />
                )}
            </View>
        </Pressable>
    );
});