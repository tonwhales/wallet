import React, { memo, useCallback, useState } from "react";
import { Pressable, View, Text } from "react-native";
import { ValueComponent } from "../../../components/ValueComponent";
import { t } from "../../../i18n/t";
import { LedgerAccount } from "../LedgerSelectAccountFragment";
import Chevron from '@assets/ic-chevron-down.svg';
import CircularProgress from "../../../components/CircularProgress/CircularProgress";
import { useTheme } from "../../../engine/hooks";

export const AccountButton = memo(({
    acc,
    onSelect,
    loadingAcc
}: {
    acc: LedgerAccount,
    onSelect: (acc: LedgerAccount) => Promise<any>,
    loadingAcc?: number
}) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const doAction = useCallback(() => {
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
                backgroundColor: theme.surfaceOnElevation,
                marginVertical: 8,
                borderRadius: 20,
            }}>
                {loading && (
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, lineHeight: 24,
                            color: theme.textPrimary
                        }}>
                            {t('hardwareWallet.actions.confirmOnLedger')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 15, lineHeight: 20,
                            color: theme.textSecondary,
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
                            color: theme.textPrimary
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
                            color: theme.textSecondary,
                        }}>
                            {acc.addr.address.slice(0, 6) + '...' + acc.addr.address.slice(acc.addr.address.length - 6)}
                        </Text>
                    </View>
                )}
                <View style={{ flexGrow: 1 }} />
                {loading ? (
                    <CircularProgress
                        style={{
                            transform: [{ rotate: '-90deg' }],
                        }}
                        progress={100}
                        animateFromValue={0}
                        duration={6000}
                        size={24}
                        width={2}
                        color={theme.accent}
                        backgroundColor={theme.transparent}
                        fullColor={null}
                        loop={true}
                        containerColor={theme.transparent}
                    />
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