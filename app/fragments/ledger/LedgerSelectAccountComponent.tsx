import React from "react";
import { View, Text } from "react-native";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";

export const LedgerSelectAccountComponent = React.memo(({ onSelect }: { onSelect: (account: number) => void }) => {

    return (
        <View style={{
            margin: 16,
            backgroundColor: Theme.item,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
        }}>
            <Text style={{
                fontWeight: '600',
                fontSize: 18,
                color: Theme.textColor,
                marginBottom: 16,
                textAlign: 'center'
            }}>
                {t('hardwareWallet.chooseAccountDescription')}
            </Text>
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 0 })}
                onPress={() => onSelect(0)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 1 })}
                onPress={() => onSelect(1)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 2 })}
                onPress={() => onSelect(2)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 3 })}
                onPress={() => onSelect(3)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 4 })}
                onPress={() => onSelect(4)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 5 })}
                onPress={() => onSelect(5)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
            <RoundButton
                title={t('hardwareWallet.actions.account', { account: 6 })}
                onPress={() => onSelect(6)}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
        </View>
    );
});