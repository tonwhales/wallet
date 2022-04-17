import BN from 'bn.js';
import * as React from 'react';
import { Image, Text, View } from 'react-native';
import { Address, resolveKnownInterface } from 'ton';
import { Theme } from '../Theme';
import { ValueComponent } from './ValueComponent';
import { formatTime } from '../utils/dates';
import { AddressComponent } from './AddressComponent';
import { Transaction } from '../sync/Transaction';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { AppConfig } from '../AppConfig';
import { Avatar } from './Avatar';
import { t } from '../i18n/t';
import { PendingTransactionAvatar } from './PendingTransactionAvatar';
import { KnownWallets } from '../secure/KnownWallets';
import { knownAddressLabel } from '../secure/knownAddressLabel';
import { Engine } from '../sync/Engine';
import { parseMessageBody } from '../secure/parseMessageBody';
import { formatSupportedBody } from '../secure/formatSupportedBody';

export function TransactionView(props: { own: Address, tx: Transaction, separator: boolean, engine: Engine, onPress: (src: Transaction) => void }) {
    const parsed = props.tx;

    // Avatar
    let avatarId = props.own.toFriendly({ testOnly: AppConfig.isTestnet });
    if (parsed.address && !parsed.address.equals(props.own)) {
        avatarId = parsed.address.toFriendly({ testOnly: AppConfig.isTestnet });
    }

    // Transaction type
    let transactionType = 'Transfer';
    if (parsed.kind === 'out') {
        if (parsed.status === 'pending') {
            transactionType = t('tx.sending');
        } else {
            transactionType = t('tx.sent');
        }
    }
    if (parsed.kind === 'in') {
        if (parsed.bounced) {
            transactionType = '⚠️ ' + t('tx.bounced');
        } else {
            transactionType = t('tx.received');
        }
    }

    // Payload ovewrite
    if (parsed.body && parsed.body.type === 'payload' && parsed.address) {
        let interfaces = props.engine.introspection.getSupportedInterfaces(parsed.address);
        let parsedBody = parseMessageBody(parsed.body.cell, interfaces);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                transactionType = f.text;
            }
        }
    }

    let friendlyAddress = parsed?.address?.toFriendly({ testOnly: AppConfig.isTestnet });
    let known = friendlyAddress ? KnownWallets[friendlyAddress] : undefined;

    return (
        <TouchableHighlight onPress={() => props.onPress(props.tx)} underlayColor={Theme.selector}>
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {parsed.status !== 'pending' && (<Avatar address={friendlyAddress} id={avatarId} size={42} />)}
                    {parsed.status === 'pending' && (
                        <PendingTransactionAvatar address={friendlyAddress} avatarId={avatarId} />
                    )}
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>{transactionType}</Text>
                        {parsed.status === 'failed' ? (
                            <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                        ) : (
                            <Text
                                style={{
                                    color: parsed.amount.gte(new BN(0)) ? '#4FAE42' : '#FF0000',
                                    fontWeight: '400',
                                    fontSize: 16,
                                    marginRight: 2
                                }}>
                                <ValueComponent value={parsed.amount} />
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10 }}>
                        <Text
                            style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {
                                known
                                    ? knownAddressLabel(known, friendlyAddress)
                                    : parsed.address
                                        ? <AddressComponent address={parsed.address} />
                                        : 'no address'
                            }
                        </Text>
                        {parsed.body && parsed.body.type === 'comment' ? <Image source={require('../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null}
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