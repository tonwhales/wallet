import React, { useCallback } from "react"
import { View, Text, Pressable, Alert } from "react-native";
import { AddressComponent } from "./AddressComponent";
import { Theme } from "../Theme";
import { ValueComponent } from "./ValueComponent";
import { PriceComponent } from "./PriceComponent";
import { t } from "../i18n/t";
import { formatDate } from "../utils/dates";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { PluginState } from "../sync/account/PluginSync";
import { loadWalletKeys, WalletKeys } from "../storage/walletKeys";
import { getCurrentAddress } from "../storage/appState";
import { Address, Cell, Contract, contractAddress, InternalMessage, Message, TonClient } from "ton";
import { sign } from "ton-crypto";
import { WalletV4Source } from "ton-contracts";
import { getRandomQueryId } from "../utils/createWithdrawStakeCommand";
import { createRemovePluginCommand } from "../utils/createRemovePluginCommand";
import { useEngine } from "../sync/Engine";
import { contractFromPublicKey } from "../sync/contractFromPublicKey";
import { backoff } from "../utils/time";

export type Maybe<T> = T | null | undefined;

class WalletV4SigningMessage implements Message {

    readonly timeout: number;
    readonly seqno: number;
    readonly walletId: number;
    readonly order: Message;
    readonly sendMode: number;
    readonly to: Address;

    constructor(args: { timeout?: Maybe<number>, seqno: Maybe<number>, walletId?: number, sendMode: number, order: Message, to: Address }) {
        this.order = args.order;
        this.sendMode = args.sendMode;
        this.to = args.to
        if (args.timeout !== undefined && args.timeout !== null) {
            this.timeout = args.timeout;
        } else {
            this.timeout = Math.floor(Date.now() / 1e3) + 60; // Default timeout: 60 seconds
        }
        if (args.seqno !== undefined && args.seqno !== null) {
            this.seqno = args.seqno;
        } else {
            this.seqno = 0;
        }
        if (args.walletId !== null && args.walletId !== undefined) {
            this.walletId = args.walletId;
        } else {
            this.walletId = 698983191;
        }
    }

    writeTo(cell: Cell) {
        cell.bits.writeUint(this.walletId, 32);
        if (this.seqno === 0) {
            for (let i = 0; i < 32; i++) {
                cell.bits.writeBit(1);
            }
        } else {
            cell.bits.writeUint(this.timeout, 32);
        }
        cell.bits.writeUint(this.seqno, 32);
        cell.bits.writeUint8(3); // Simple order

        // Write order
        // cell.bits.writeUint8(this.sendMode);
        // let orderCell = new Cell();
        // this.order.writeTo(orderCell);
        cell.bits.writeAddress(this.to);
        cell.bits.writeUint(getRandomQueryId(), 64); // Query ID
        cell.bits.writeCoins(100000); // Gas
        // cell.refs.push(orderCell);
    }
}

export class WalletV4Contract implements Contract {

    static async create(source: WalletV4Source) {
        let address = await contractAddress(source);
        return new WalletV4Contract(address, source);
    }

    readonly address: Address;
    readonly source: WalletV4Source;

    constructor(address: Address, source: WalletV4Source) {
        this.address = address;
        this.source = source;
    }

    async getSeqNo(client: TonClient) {
        if (await client.isContractDeployed(this.address)) {
            let res = await client.callGetMethod(this.address, 'seqno');
            return parseInt(res.stack[0][1], 16);
        } else {
            return 0;
        }
    }

    async createTransfer(args: {
        seqno: number,
        sendMode: number,
        walletId: number,
        order: InternalMessage,
        secretKey?: Maybe<Buffer>,
        timeout?: Maybe<number>,
        to: Address
    }) {

        let signingMessage = new WalletV4SigningMessage({
            timeout: args.timeout,
            walletId: args.walletId,
            seqno: args.seqno,
            sendMode: args.sendMode,
            order: args.order,
            to: args.to
        });

        // Sign message
        const cell = new Cell();
        signingMessage.writeTo(cell);
        let signature: Buffer;
        if (args.secretKey) {
            signature = sign(await cell.hash(), args.secretKey);
        } else {
            signature = Buffer.alloc(64);
        }

        // Body
        const body = new Cell();
        body.bits.writeBuffer(signature);
        signingMessage.writeTo(body);

        return body;
    }
}

export const SubscriptionButton = React.memo((
    {
        address,
        subscription
    }: {
        address: string
        subscription: PluginState
    }
) => {
    const navigation = useTypedNavigation();
    const acc = React.useMemo(() => getCurrentAddress(), []);
    const engine = useEngine();
    const account = engine.products.main.useState();

    console.log({ address });

    const onCancelSub = useCallback(
        async () => {
            await new Promise<boolean>(resolve => {
                Alert.alert(
                    t('products.subscriptions.subscription.cancel'),
                    t('products.subscriptions.subscription.cancelConfirm'),
                    [{
                        text: t('common.yes'),
                        style: 'destructive',
                        onPress: async () => {
                            const contract = await contractFromPublicKey(acc.publicKey);

                            let walletKeys: WalletKeys;
                            try {
                                walletKeys = await loadWalletKeys(acc.secretKeyEnc);
                            } catch (e) {
                                resolve(false);
                                return;
                            }

                            const transfer = new Cell();
                            const transferCell = createRemovePluginCommand(
                                account.seqno,
                                contract.source.walletId,
                                Math.floor(Date.now() / 1e3) + 60,
                                Address.parse(address)
                            );
                            transfer.bits.writeBuffer(sign(await transferCell.hash(), walletKeys.keyPair.secretKey));
                            transfer.writeCell(transferCell);
                            console.log('Sending... ');
                            await backoff(() => engine.connector.sendExternalMessage(contract, transfer));
                            console.log('Sent');

                            console.log({ transfer: transfer.toBoc({ idx: false }).toString('base64') });


                            // navigation.navigate(
                            //     'Transfer',
                            //     {
                            //         target: address,
                            //         amount: toNano('0.1'),
                            //         payload: createRemovePluginCommand(),
                            //     }
                            // );
                            resolve(true);
                            // storagePersistence.clearAll();
                            // navigation.goBack();
                        }
                    }, {
                        text: t('common.no'),
                        onPress: () => {
                            resolve(false);
                        }
                    }]);
            });
        },
        [subscription, account, acc, engine],
    );

    if (subscription.type === 'unknown') {
        return (
            <Pressable style={
                ({ pressed }) => {
                    return {
                        opacity: pressed ? 0.3 : 1
                    }
                }
            }
                onPress={onCancelSub}
            >
                <View style={{
                    minHeight: 62, borderRadius: 14,
                    backgroundColor: 'white', flexDirection: 'row',
                    padding: 10, flex: 1
                }}>
                    <View
                        style={{
                            height: 42, width: 42,
                            backgroundColor: 'white',
                            borderRadius: 26,
                            overflow: 'hidden',
                            marginRight: 10
                        }}
                    >
                        <View style={{
                            position: 'absolute',
                            top: 0, bottom: 0,
                            left: 0, right: 0,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontWeight: '800',
                                fontSize: 18,
                            }}>
                                {'U'}
                            </Text>
                        </View>
                        {/* {!!subscription.icon && (
                        <Image
                        source={subscription.icon}
                        style={{
                            height: 42, width: 42, borderRadius: 10,
                            overflow: 'hidden'
                        }} />
                    )} */}
                        <View style={{
                            borderRadius: 26,
                            borderWidth: 0.5,
                            borderColor: 'black',
                            backgroundColor: 'transparent',
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            opacity: 0.06
                        }} />
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            flex: 1,
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{
                            fontSize: 16,
                            color: Theme.textColor,
                            fontWeight: '600',
                            flex: 1,
                            marginBottom: 3
                        }}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            {'Unknown contract'}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    const periodFullDays = Math.floor(subscription.state.period / (60 * 60 * 24));
    const nextBilling = subscription.state.lastPayment + subscription.state.period;
    let period = '';
    if (periodFullDays === 30) {
        period = t('products.subscriptions.monthly');
    } else if (periodFullDays > 30) {
        period = t('products.subscriptions.inDays', { count: periodFullDays });
    } else {
        period = t('products.subscriptions.inHours', { count: Math.floor(subscription.state.period / (60 * 60)) });
    }

    return (
        <Pressable
            style={({ pressed }) => {
                return {
                    opacity: pressed ? 0.3 : 1
                }
            }}
            onPress={() => {
                console.log(address);
                navigation.navigate('Subscription', { address });
            }}
        >
            <View style={{
                minHeight: 62, borderRadius: 14,
                backgroundColor: 'white', flexDirection: 'row',
                padding: 10, flex: 1
            }}>
                <View
                    style={{
                        height: 42, width: 42,
                        backgroundColor: 'white',
                        borderRadius: 26,
                        overflow: 'hidden',
                        marginRight: 10
                    }}
                >
                    <View style={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: 0, right: 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontWeight: '800',
                            fontSize: 18,
                        }}>
                            {'Sub'}
                        </Text>
                    </View>
                    {/* {!!subscription.icon && (
                    <Image
                    source={subscription.icon}
                    style={{
                        height: 42, width: 42, borderRadius: 10,
                        overflow: 'hidden'
                    }} />
                )} */}
                    <View style={{
                        borderRadius: 26,
                        borderWidth: 0.5,
                        borderColor: 'black',
                        backgroundColor: 'transparent',
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0.06
                    }} />
                </View>
                <View
                    style={{
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{
                        fontSize: 16,
                        color: Theme.textColor,
                        fontWeight: '600',
                        flex: 1,
                        marginBottom: 3
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        <AddressComponent address={subscription.state.wallet} />
                    </Text>
                    {period!! && period.length > 0 && (
                        <Text style={{
                            fontSize: 13, fontWeight: '400',
                            maxWidth: 150, color: '#787F83'
                        }}>
                            {period}
                        </Text>
                    )}
                    <Text style={{
                        fontSize: 13, fontWeight: '400',
                        maxWidth: 150, color: '#787F83'
                    }}>
                        {t('products.subscriptions.nextBilling') + ': ' + formatDate(nextBilling)}
                    </Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text style={{ color: Theme.textColor, fontWeight: '400', fontSize: 16, marginBottom: 5 }}>
                        <ValueComponent value={subscription.state.amount} /> {' TON'}
                    </Text>
                    <PriceComponent
                        amount={subscription.state.amount}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end', height: 14
                        }}
                        textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                    />
                </View>
            </View>
        </Pressable>
    )
})