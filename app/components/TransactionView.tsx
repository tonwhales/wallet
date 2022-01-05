import BN from 'bn.js';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Address, fromNano, RawTransaction } from 'ton';
import { format } from 'date-fns';
import { AddressComponent } from './AddressComponent';
import { Theme } from '../Theme';
import { ValueComponent } from './ValueComponent';

export function TransactionView(props: { tx: RawTransaction, onPress: (src: RawTransaction) => void }) {
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
        <Pressable style={{ alignSelf: 'stretch', flexDirection: 'column', paddingHorizontal: 16, marginTop: 4, marginBottom: 4 }} onPress={() => props.onPress(props.tx)}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', }}>
                <Text style={{ color: amount.gte(new BN(0)) ? '#4FAE42' : '#EB4D3D', fontWeight: '700', fontSize: 18, marginRight: 2 }}>💎 <ValueComponent value={amount} centFontSize={15} /></Text>
                <Text style={{ fontSize: 15, flexGrow: 1, flexBasis: 0, color: Theme.textSecondary, fontWeight: '500' }}>{amount.gte(new BN(0)) ? 'from' : 'to'}</Text>
                <Text style={{ color: Theme.textSecondary, fontSize: 15 }}>{format(tx.time * 1000, 'hh:mm bb')}</Text>
            </View>
            <View style={{ marginTop: 4, marginBottom: 4 }}>
                <Text style={{ color: Theme.textColor, fontSize: 15 }} ellipsizeMode="middle" numberOfLines={1}>{address ? address.toFriendly() : '<no address>'}</Text>
            </View>
            {fees.gt(new BN(0)) && (
                <View>
                    <Text style={{ color: Theme.textSecondary }}>
                        -{fromNano(fees)} blockchain fees
                    </Text>
                </View>
            )}
            <View style={{ height: 1, marginTop: 8, alignSelf: 'stretch', backgroundColor: Theme.divider }} />
        </Pressable>
    );
}