import BN from 'bn.js';
import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Address } from 'ton';
import { Theme } from '../Theme';
import { ValueComponent } from './ValueComponent';
import { formatTime } from '../utils/dates';
import { avatarHash } from '../utils/avatarHash';
import { AddressComponent } from './AddressComponent';
import { Transaction } from '../sync/Transaction';
import { TouchableHighlight } from 'react-native-gesture-handler';

export function TransactionView(props: { own: Address, tx: Transaction, separator: boolean, onPress: (src: Transaction) => void }) {
    const parsed = props.tx;

    // Avatar
    let avatarImage = require('../../assets/avatar_own.png');
    if (parsed.address && !parsed.address.equals(props.own)) {
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
        avatarImage = avatars[avatarHash(parsed.address.toFriendly(), avatars.length)];
    }

    // Transaction type
    let transactionType = 'Transfer';
    if (parsed.kind === 'out') {
        if (parsed.status === 'pending') {
            transactionType = 'Sending #' + parsed.seqno!;
        } else {
            transactionType = 'Sent #' + parsed.seqno!;
        }
    }
    if (parsed.kind === 'in') {
        transactionType = 'Received';
    }

    return (
        <TouchableHighlight onPress={() => props.onPress(props.tx)} underlayColor={Theme.selector}>
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <Image source={avatarImage} style={{ width: 42, height: 42, borderRadius: 21 }} />
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="middle" numberOfLines={1}>{transactionType}</Text>
                        {parsed.status === 'failed' ? (
                            <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                        ) : (
                            <Text style={{ color: parsed.amount.gte(new BN(0)) ? '#4FAE42' : '#FF0000', fontWeight: '600', fontSize: 16, marginRight: 2 }}><ValueComponent value={parsed.amount} /></Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10 }}>
                        <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }} ellipsizeMode="middle" numberOfLines={1}>{parsed.address ? <AddressComponent address={parsed.address} /> : 'no address'}</Text>
                        {parsed.body ? <Image source={require('../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null}
                        <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 4 }}>{formatTime(parsed.time)}</Text>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    {props.separator && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider }} />)}
                </View>
            </View>
        </TouchableHighlight>
    );
}
TransactionView.displayName = 'TransactionView';