import BN from 'bn.js';
import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Address, parseMessage, RawTransaction } from 'ton';
import { Theme } from '../Theme';
import { ValueComponent } from './ValueComponent';
import { formatTime } from '../utils/formatTime';
import { avatarHash } from '../utils/avatarHash';
import { AddressComponent } from './AddressComponent';

export function TransactionView(props: { own: Address, tx: RawTransaction, separator: boolean, onPress: (src: RawTransaction) => void }) {
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

    // Avatar
    let avatarImage = require('../../assets/avatar_own.png');
    if (address && !address.equals(props.own)) {
        const avatars = [
            require('../../assets/avatar_1.png'),
            require('../../assets/avatar_2.png'),
            require('../../assets/avatar_3.png'),
            require('../../assets/avatar_4.png'),
            require('../../assets/avatar_5.png'),
            require('../../assets/avatar_6.png'),
            require('../../assets/avatar_7.png'),
            require('../../assets/avatar_8.png')
        ];
        avatarImage = avatars[avatarHash(address.toFriendly(), avatars.length)];
    }

    // Transaction type
    let transactionType = 'Transfer';
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        transactionType = 'Send';
    }
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        transactionType = 'Receive';
    }

    return (
        <Pressable style={(s) => ({ alignSelf: 'stretch', flexDirection: 'row', height: 62, backgroundColor: s.pressed ? Theme.selector : 'white' })} onPress={() => props.onPress(props.tx)}>
            <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                <Image source={avatarImage} style={{ width: 42, height: 42, borderRadius: 21 }} />
            </View>
            <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                    <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="middle" numberOfLines={1}>{transactionType}</Text>
                    <Text style={{ color: amount.gte(new BN(0)) ? '#4FAE42' : '#FF0000', fontWeight: '600', fontSize: 16, marginRight: 2 }}><ValueComponent value={amount} /></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10 }}>
                    <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }} ellipsizeMode="middle" numberOfLines={1}>{address ? <AddressComponent address={address} /> : 'no address'}</Text>
                    <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 4 }}>{formatTime(tx.time)}</Text>
                </View>
                <View style={{ flexGrow: 1 }} />
                {props.separator && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider }} />)}
            </View>
        </Pressable>
    );
}