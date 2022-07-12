import BN from 'bn.js';
import * as React from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import { Address, fromNano, toNano } from 'ton';
import { Theme } from '../../../Theme';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/AddressComponent';
import { TouchableHighlight } from 'react-native';
import { AppConfig } from '../../../AppConfig';
import { Avatar } from '../../../components/Avatar';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';
import { t } from '../../../i18n/t';
import { Engine } from '../../../engine/Engine';

function knownAddressLabel(wallet: KnownWallet, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly })})`
}

export function TransactionView(props: { own: Address, tx: string, separator: boolean, engine: Engine, onPress: (src: string) => void }) {
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    const tx = props.engine.products.main.useTransaction(props.tx);
    let parsed = tx.base;
    let operation = tx.operation;

    // Operation
    let friendlyAddress = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let avatarId = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let item = operation.items[0];
    let op: string;
    if (operation.op) {
        op = operation.op;
    } else {
        if (parsed.kind === 'out') {
            if (parsed.status === 'pending') {
                op = t('tx.sending');
            } else {
                op = t('tx.sent');
            }
        } else if (parsed.kind === 'in') {
            if (parsed.bounced) {
                op = '⚠️ ' + t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets[friendlyAddress]) {
        known = KnownWallets[friendlyAddress];
    } else if (operation.title) {
        known = { name: operation.title };
    }

    let spam = props.engine.products.serverConfig.useIsSpamWallet(friendlyAddress)
        || (
            Math.abs(parseFloat(fromNano(parsed.amount))) < 0.05
            && tx.base.body?.type === 'comment'
        );

    return (
        <TouchableHighlight onPress={() => props.onPress(props.tx)} underlayColor={Theme.selector} style={{ backgroundColor: Theme.item }}>
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: fontScaleNormal ? 62 : undefined, minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {parsed.status !== 'pending' && (
                        <Avatar
                            address={friendlyAddress}
                            id={avatarId}
                            size={42}
                            image={tx.icon ? tx.icon : undefined}
                            spam={spam}
                        />
                    )}
                    {parsed.status === 'pending' && (
                        <PendingTransactionAvatar address={friendlyAddress} avatarId={avatarId} />
                    )}
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                        <View style={{
                            flexDirection: 'row',
                            flexGrow: 1, flexBasis: 0, marginRight: 16,
                        }}>
                            <Text style={{ color: Theme.textColor, fontSize: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>{op}</Text>
                            {spam && (
                                <View style={{
                                    borderColor: '#ADB6BE',
                                    borderWidth: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: 4,
                                    marginLeft: 6,
                                    paddingHorizontal: 4
                                }}>
                                    <Text style={{ color: Theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                                </View>
                            )}
                        </View>
                        {parsed.status === 'failed' ? (
                            <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                        ) : (
                            <Text
                                style={{
                                    color: item.amount.gte(new BN(0)) ? spam ? Theme.textColor : '#4FAE42' : '#FF0000',
                                    fontWeight: '400',
                                    fontSize: 16,
                                    marginRight: 2
                                }}>
                                <ValueComponent value={item.amount} />
                                {item.kind === 'token' ? ' ' + item.symbol : ''}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10, marginBottom: fontScaleNormal ? undefined : 10 }}>
                        <Text
                            style={{ color: Theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {known ? knownAddressLabel(known, friendlyAddress) : <AddressComponent address={operation.address} />}
                        </Text>
                        {!!operation.comment ? <Image source={require('../../../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null}
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