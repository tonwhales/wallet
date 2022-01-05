import BN from 'bn.js';
import * as React from 'react';
import { Text, View } from 'react-native';
import { Address, fromNano, RawTransaction } from 'ton';
import { format } from 'date-fns';
import { AddressComponent } from './AddressComponent';

export function TransactionView(props: { tx: RawTransaction }) {
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
        <View style={{ alignSelf: 'stretch', flexDirection: 'column', paddingHorizontal: 16, paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: amount.gte(new BN(0)) ? 'green' : 'red', fontWeight: '800', fontSize: 16, marginRight: 4 }}>💎 {fromNano(amount)}</Text>
                <Text style={{ fontSize: 16, flexGrow: 1, flexBasis: 0 }}>{amount.gte(new BN(0)) ? 'from' : 'to'}</Text>
                <Text>{format(tx.time * 1000, 'hh:mm bbbb')}</Text>
            </View>
            <View>
                <Text>{address ? <AddressComponent address={address} /> : '<no address>'}</Text>
            </View>
            {fees.gt(new BN(0)) && (
                <View>
                    <Text>
                        -{fromNano(fees)} blockchain fees
                    </Text>
                </View>
            )}
        </View>
    );
}