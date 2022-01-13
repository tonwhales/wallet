import BN from 'bn.js';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, RawTransaction } from 'ton';
import { ValueComponent } from '../../components/ValueComponent';
import { Theme } from '../../Theme';

export function TransactionPreview(props: { tx: RawTransaction }) {
    const { t } = useTranslation();

    const safeArea = useSafeAreaInsets();
    const tx = props.tx;

    // Fees
    let fees = tx.fees.coins;
    if (tx.description.storagePhase) {
        fees = fees.add(tx.description.storagePhase.storageFeesCollected);
    }

    // Delta
    let amount = new BN(0);
    let address: Address | null = null;
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        amount = amount.add(tx.inMessage.info.value.coins);
        address = tx.inMessage.info.src;
    }
    for (let out of tx.outMessages) {
        if (out.info.type === 'internal') {
            amount = amount.sub(out.info.value.coins);
            fees = fees.add(out.info.fwdFee);
            address = out.info.dest;
        }
    }

    return (
        <View style={{ paddingBottom: safeArea.bottom }}>
            <View style={{ height: 50, alignItems: 'center', flexDirection: 'row' }}>
                <View style={{ flexGrow: 1 }} />
                <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17 }}>{t('Transaction')}</Text>
                <View style={{ flexGrow: 1, alignItems: 'flex-end', marginRight: 16, flexBasis: 0 }}>
                    {/* <Text style={{ color: Theme.accent, fontWeight: '600', fontSize: 17 }}>Done</Text> */}
                </View>
            </View>
            <Text style={{ fontSize: 48, color: amount.gte(new BN(0)) ? '#4FAE42' : '#EB4D3D', fontWeight: '700', alignSelf: 'center', marginHorizontal: 16 }}>
                💎 <ValueComponent value={amount} centFontStyle={{ fontSize: 24 }} />
            </Text>
            {address && (
                <Text selectable={true} style={{ marginTop: 32, marginBottom: 72, width: 265, textAlign: 'center', alignSelf: 'center' }} numberOfLines={1} ellipsizeMode="middle">
                    <Text style={{ fontSize: 18, color: Theme.textColor, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{address.toFriendly()}</Text>
                </Text>
            )}
        </View>
    );
}