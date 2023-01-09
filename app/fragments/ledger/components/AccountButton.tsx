import React from "react";
import { Pressable, View, Text, ActivityIndicator } from "react-native";
import { ValueComponent } from "../../../components/ValueComponent";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { LedgerAccount } from "./LedgerSelectAccount";

export const AccountButton = React.memo(({ acc, onSelect }: { acc: LedgerAccount, onSelect: (acc: LedgerAccount) => Promise<any> }) => {
    const [loading, setLoading] = React.useState(false);
    const doAction = React.useCallback(() => {
        setLoading(true);
        (async () => {
            try {
                await onSelect(acc);
            } finally {
                setLoading(false);
            }
        })();
    }, [onSelect, acc]);

    return (
        <Pressable onPress={doAction} style={({ pressed }) => {
            return {
                opacity: pressed ? 0.3 : 1
            };
        }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: Theme.item,
                marginVertical: 5,
                borderRadius: 14,
            }}>
                <View>
                    <Text style={{
                        fontWeight: '700',
                        fontSize: 16,
                        color: Theme.textColor,
                        marginBottom: 8
                    }}>
                        <ValueComponent
                            value={acc.balance}
                            precision={3}
                        />
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor,
                    }}>
                        {acc.addr.address.slice(0, 6) + '...' + acc.addr.address.slice(acc.addr.address.length - 6)}
                    </Text>
                </View>
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    color: Theme.accent,
                }}>
                    {t('common.connect')}
                </Text>
                {loading && (
                    <View style={{
                        position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: Theme.item, borderRadius: 14
                    }}>
                        <ActivityIndicator color={Theme.accent} size='small' />
                    </View>
                )}
            </View>
        </Pressable>
    );
});