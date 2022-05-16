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
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { Engine } from '../../../sync/Engine';
import { ContractMetadata } from '../../../sync/metadata/Metadata';
import { JettonMasterState } from '../../../sync/jettons/JettonMasterSync';
import { resolveOperation } from '../../../operations/resolveOperation';
import { KnownWallet } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';

const ZERO_ADDRESS = new Address(-1, Buffer.alloc(32, 0));

function knownAddressLabel(wallet: KnownWallet, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly })})`
}

export function TransactionView(props: { own: Address, tx: Transaction, separator: boolean, engine: Engine, onPress: (src: Transaction) => void }) {
    const parsed = props.tx;

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

    // Operation
    let operation = resolveOperation({ tx: parsed, metadata, jettonMaster: masterMetadata, account: props.own });
    let friendlyAddress = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let avatarId = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let item = operation.items[0];

    // Avatar
    let downloaded: string | null = null;
    if (operation.image) {
        downloaded = props.engine.downloads.use(operation.image);
    } else {
        downloaded = props.engine.downloads.use('');
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
                        <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>{operation.name}</Text>
                        {parsed.status === 'failed' ? (
                            <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                        ) : (
                            <Text
                                style={{
                                    color: item.amount.gte(new BN(0)) ? '#4FAE42' : '#FF0000',
                                    fontWeight: '400',
                                    fontSize: 16,
                                    marginRight: 2
                                }}>
                                <ValueComponent value={item.amount} />
                                {item.kind === 'token' ? ' ' + item.symbol : ''}
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
                                operation.known
                                    ? knownAddressLabel(operation.known, friendlyAddress)
                                    : <AddressComponent address={operation.address} />
                            }
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