import BN from 'bn.js';
import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Address, fromNano, parseMessage, RawTransaction } from 'ton';
import { Theme } from '../Theme';
import { ValueComponent } from './ValueComponent';
import { formatTime } from '../utils/formatTime';
import FastImage from 'react-native-fast-image';

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
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        const parse = tx.inMessage.body.beginParse();

        parse.skip(512 + 32 + 32); // Signature + wallet_id + timeout
        const seqno = parse.readUintNumber(32);
        const op = parse.readUintNumber(8);

        console.log(seqno + ': ' + op);

        if (op === 0) {
            const sendMode = parse.readUintNumber(8);
            const msg = parseMessage(parse.readRef());
            if (msg.info.type === 'internal') {
                if (msg.info.dest) {
                    address = msg.info.dest;
                }
            }
            // console.warn(msg);
            // Simple transfer
        }
    }
    for (let out of tx.outMessages) {
        if (out.info.type === 'internal') {
            amount = amount.sub(out.info.value.coins);
            fees = fees.add(out.info.fwdFee);
            address = out.info.dest;
        }
    }

    return (
        <Pressable style={(s) => ({ alignSelf: 'stretch', flexDirection: 'row', height: 66, backgroundColor: s.pressed ? Theme.divider : 'white' })} onPress={() => props.onPress(props.tx)}>
            <View style={{ width: 44, height: 44, borderRadius: 22, marginVertical: 11, marginLeft: 16, marginRight: 16 }}>
                <Image
                    source={{
                        uri: 'https://source.boringavatars.com/marble/120/Maria%20Mitchell?colors=264653,2a9d8f,e9c46a,f4a261,e76f51'
                    }}
                    style={{ width: 44, height: 44, backgroundColor: '#303757', borderRadius: 22 }}
                    resizeMode="cover"
                />
            </View>
            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 11, marginRight: 14 }}>
                    <Text style={{ color: Theme.textColor, fontSize: 17, flexGrow: 1, flexBasis: 0, marginRight: 16 }} ellipsizeMode="middle" numberOfLines={1}>{address ? address.toFriendly() : '<no address>'}</Text>
                    <Text style={{ color: amount.gte(new BN(0)) ? '#4FAE42' : '#FF0000', fontWeight: '400', fontSize: 17, marginRight: 2 }}><ValueComponent value={amount} /></Text>
                    {/* <Text style={{ color: amount.gte(new BN(0)) ? '#4FAE42' : '#EB4D3D', fontWeight: '700', fontSize: 18, marginRight: 2 }}>💎 <ValueComponent value={amount} centFontSize={15} /></Text>
                    <Text style={{ fontSize: 15, flexGrow: 1, flexBasis: 0, color: Theme.textSecondary, fontWeight: '500' }}>{amount.gte(new BN(0)) ? 'from' : 'to'}</Text>
                    <Text style={{ color: Theme.textSecondary, fontSize: 15 }}>{format(tx.time * 1000, 'hh:mm bb')}</Text> */}
                </View>
                {/* <View style={{ marginTop: 4, marginBottom: 4 }}>
                    <Text style={{ color: Theme.textColor, fontSize: 15 }} ellipsizeMode="middle" numberOfLines={1}>{address ? address.toFriendly() : '<no address>'}</Text>
                </View> */}
                {/* {fees.gt(new BN(0)) && (
                    <View>
                        <Text style={{ color: Theme.textSecondary }}>
                            -{fromNano(fees)} blockchain fees
                        </Text>
                    </View>
                )} */}
                <Text style={{ color: Theme.textSecondary, fontSize: 15, marginTop: 4 }}>{formatTime(tx.time)}</Text>
                <View style={{ flexGrow: 1 }} />
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider }} />
            </View>
        </Pressable>
    );
}