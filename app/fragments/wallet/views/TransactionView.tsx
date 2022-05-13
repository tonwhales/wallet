import BN from 'bn.js';
import * as React from 'react';
import { Image, Text, View } from 'react-native';
import { Address } from 'ton';
import { Theme } from '../../../Theme';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/AddressComponent';
import { Transaction } from '../../../sync/Transaction';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { AppConfig } from '../../../AppConfig';
import { Avatar } from '../../../components/Avatar';
import { t } from '../../../i18n/t';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownWallets } from '../../../secure/KnownWallets';
import { knownAddressLabel } from '../../../secure/knownAddressLabel';
import { Engine } from '../../../sync/Engine';
import { parseMessageBody } from '../../../secure/parseMessageBody';
import { formatSupportedBody } from '../../../secure/formatSupportedBody';
import { ContractMetadata } from '../../../sync/metadata/Metadata';
import { JettonMasterState } from '../../../sync/jettons/JettonMasterSync';

const ZERO_ADDRESS = new Address(-1, Buffer.alloc(32, 0));

export function TransactionView(props: { own: Address, tx: Transaction, separator: boolean, engine: Engine, onPress: (src: Transaction) => void }) {
    const parsed = props.tx;

    // Address
    let address = parsed.address;

    // Amount
    let amount = parsed.amount;
    let symbol: string | null = null;

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

    // Fetch metadata
    let metadata: ContractMetadata | null;
    if (parsed.address) {
        metadata = props.engine.storage.metadata(parsed.address).use();
    } else {
        metadata = props.engine.storage.metadata(ZERO_ADDRESS).use();
    }

    // Master metadata
    let masterMetadata: JettonMasterState | null;
    if (metadata && metadata.jettonWallet) {
        masterMetadata = props.engine.storage.jettonMaster(metadata.jettonWallet.master).use();
    } else if (metadata && metadata.jettonMaster && parsed.address) {
        masterMetadata = props.engine.storage.jettonMaster(parsed.address).use();
    } else {
        masterMetadata = props.engine.storage.jettonMaster(ZERO_ADDRESS).use();
    }

    // Payload ovewrite
    if (parsed.body && parsed.body.type === 'payload' && metadata && !masterMetadata) {
        let parsedBody = parseMessageBody(parsed.body.cell, metadata.interfaces);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                transactionType = f.text;
            }
        }
    }

    // Jetton parsing
    let parsedJetton = false;
    if (parsed.body && parsed.body.type === 'payload' && masterMetadata && masterMetadata.symbol && metadata && metadata.jettonWallet) {
        let parsedBody = parseMessageBody(parsed.body.cell, ['311736387032003861293477945447179662681']);
        if (parsedBody) {
            parsedJetton = true;
            let f = formatSupportedBody(parsedBody);
            if (f) {
                transactionType = f.text;
            }
            if (parsedBody.type === 'jetton::transfer') {
                address = parsedBody.data['destination'] as Address;
                amount = parsedBody.data['amount'] as BN;
                symbol = masterMetadata.symbol;
            }
            if (parsedBody.type === 'jetton::transfer_notification') {
                address = parsedBody.data['sender'] as Address;
                amount = parsedBody.data['amount'] as BN;
                symbol = masterMetadata.symbol;
            }
        }
    }

    // Resolve address
    let friendlyAddress = address?.toFriendly({ testOnly: AppConfig.isTestnet });
    let known = friendlyAddress ? KnownWallets[friendlyAddress] : undefined;

    // Jetton
    if (metadata && (metadata.jettonMaster || metadata.jettonWallet) && !parsedJetton) {
        if (masterMetadata && masterMetadata.name) {
            known = { name: masterMetadata.name };
        } else {
            known = { name: 'Token Contract' };
        }
    }

    // Avatar
    let downloaded: string | null = null;
    if (masterMetadata && masterMetadata.image) {
        props.engine.accounts.getDownload(masterMetadata.image);
        downloaded = props.engine.storage.download(masterMetadata.image).use();
    } else {
        downloaded = props.engine.storage.download('').use();
    }

    return (
        <TouchableHighlight onPress={() => props.onPress(props.tx)} underlayColor={Theme.selector}>
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {parsed.status !== 'pending' && (<Avatar address={friendlyAddress} id={avatarId} size={42} image={downloaded ? downloaded : undefined} />)}
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
                                    color: amount.gte(new BN(0)) ? '#4FAE42' : '#FF0000',
                                    fontWeight: '400',
                                    fontSize: 16,
                                    marginRight: 2
                                }}>
                                <ValueComponent value={amount} />
                                {symbol ? ' ' + symbol : ''}
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
                        {parsed.body && parsed.body.type === 'comment' ? <Image source={require('../../../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null}
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