import React from "react"
import { View, Text, Pressable, Alert } from "react-native";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";

import TonSign from '../../../assets/ic_ton_sign.svg';
import TransferToArrow from '../../../assets/ic_transfer_to.svg';
import Contact from '../../../assets/ic_transfer_contact.svg';
import VerifiedIcon from '../../../assets/ic_verified.svg';
import TonSignGas from '../../../assets/ic_transfer_gas.svg';
import SignLock from '../../../assets/ic_sign_lock.svg';
import WithStateInit from '../../../assets/ic_sign_contract.svg';
import SmartContract from '../../../assets/ic_sign_smart_contract.svg';
import Staking from '../../../assets/ic_sign_staking.svg';
import Question from '../../../assets/ic_question.svg';
import { WImage } from "../WImage";
import { Address, Cell, fromNano, SupportedMessage, toNano } from "ton";
import { AddressComponent } from "../AddressComponent";
import { Avatar } from "../Avatar";
import BN from "bn.js";
import { ContractMetadata } from "../../engine/metadata/Metadata";
import { Operation } from "../../engine/transactions/types";
import { KnownWallet } from "../../secure/KnownWallets";
import { AddressContact } from "../../engine/products/SettingsProduct";
import { JettonMasterState } from "../../engine/sync/startJettonMasterSync";
import { AppConfig } from "../../AppConfig";
import { t } from "../../i18n/t";
import { ItemGroup } from "../ItemGroup";
import { ItemCollapsible } from "../ItemCollapsible";
import { ItemAddress } from "../ItemAddress";
import { ItemDivider } from "../ItemDivider";
import { ItemLarge } from "../ItemLarge";

export const TransferComponent = React.memo(({ transfer, last, first }: {
    transfer: {
        message: {
            addr: {
                address: Address,
                balance: BN,
                active: boolean,
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: string,
            payload?: string,
            stateInit?: string,
        },
        operation: Operation,
        parsedBody: SupportedMessage | null,
        known?: KnownWallet,
        spam: boolean,
        jettonAmount: BN | null,
        contact?: AddressContact,
        jettonMaster: JettonMasterState | null
    },
    first?: boolean,
    last?: boolean
}) => {
    const amount = toNano(fromNano(transfer.message.amount));
    const friendlyTarget = transfer.message.addr.address.toFriendly({ testOnly: AppConfig.isTestnet });
    const inactiveAlert = React.useCallback(() => {
        Alert.alert(t('transfer.error.addressIsNotActive'),
            t('transfer.error.addressIsNotActiveDescription'),
            [{ text: t('common.gotIt') }])
    }, [],);

    return (
        <>
            <View
                style={{
                    marginTop: first ? 30 : 0,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 20
                }}
            >
                <View>
                    {!transfer.jettonAmount && (
                        <>
                            <View style={{
                                marginLeft: 40 + 6,
                                minHeight: 40,
                                justifyContent: 'center'
                            }}>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 20,
                                    color: Theme.textColor,
                                    marginLeft: 2,
                                }}>
                                    {`${fromNano(amount)} TON`}
                                </Text>
                                <PriceComponent
                                    prefix={'~'}
                                    amount={amount}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0,
                                        marginLeft: 2
                                    }}
                                    textStyle={{ color: Theme.textColor, fontWeight: '400', fontSize: 14 }}
                                />
                                {!!transfer.operation.comment && transfer.operation.comment.length > 0 && (
                                    <View style={{
                                        backgroundColor: Theme.background,
                                        padding: 10,
                                        borderRadius: 6,
                                        marginTop: 8,
                                        marginBottom: 22,
                                    }}>
                                        <Text>
                                            {`💬 ${transfer.operation.comment}`}
                                        </Text>
                                        <View style={{
                                            marginLeft: 40 + 6,
                                            marginVertical: 14,
                                            justifyContent: 'center',
                                            minHeight: 22,
                                            position: 'absolute',
                                            left: -82, top: transfer.operation.comment.length > 32 ? 22 : 8, bottom: 0,
                                        }}>
                                            <View>
                                                <TransferToArrow />
                                            </View>
                                        </View>
                                    </View>
                                )}
                                <View style={{
                                    position: 'absolute',
                                    left: -48, top: 0, bottom: 0,
                                    backgroundColor: Theme.accent,
                                    height: 40, width: 40,
                                    borderRadius: 40,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 2
                                }}>
                                    <TonSign />
                                </View>
                            </View>
                            {!(!!transfer.operation.comment && transfer.operation.comment.length > 0) && (
                                <View style={{
                                    marginLeft: 40 + 6,
                                    marginVertical: 14,
                                    justifyContent: 'center',
                                    minHeight: 22,
                                }}>
                                    <View style={{
                                        position: 'absolute',
                                        left: -26 - 10, top: 0, bottom: 0,
                                    }}>
                                        <TransferToArrow />
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                    {!!transfer.jettonAmount && !!transfer.jettonMaster && (
                        <>
                            <View style={{
                                position: 'absolute',
                                top: 44,
                                bottom: transfer.contact ? 48 : 44,
                                left: 17,
                                width: 2,
                                borderRadius: 2,
                                backgroundColor: Theme.divider
                            }} />
                            <View style={{
                                marginLeft: 40 + 6,
                                minHeight: 40,
                                justifyContent: 'center'
                            }}>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 20,
                                    color: Theme.textColor,
                                    marginLeft: 2
                                }}>
                                    {`${fromNano(transfer.jettonAmount)} ${transfer.jettonMaster.symbol}`}
                                </Text>
                                {!!transfer.operation.comment && transfer.operation.comment.length > 0 && (
                                    <View style={{
                                        backgroundColor: Theme.background,
                                        padding: 10,
                                        borderRadius: 6,
                                        marginTop: 8
                                    }}>
                                        <Text>
                                            {`💬 ${transfer.operation.comment}`}
                                        </Text>
                                    </View>
                                )}
                                <View style={{
                                    position: 'absolute',
                                    left: -48, top: 0, bottom: 0,
                                    backgroundColor: Theme.accent,
                                    height: 40, width: 40,
                                    borderRadius: 40,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 2
                                }}>
                                    <WImage
                                        src={transfer.jettonMaster.image?.preview256}
                                        blurhash={transfer.jettonMaster.image?.blurhash}
                                        width={40}
                                        heigh={40}
                                        borderRadius={40}
                                    />
                                </View>
                            </View>
                            <View style={{
                                marginLeft: 40 + 6,
                                minHeight: 24,
                                marginTop: 20, marginBottom: 30,
                                justifyContent: 'center'
                            }}>
                                {!AppConfig.isTestnet && (
                                    <PriceComponent
                                        prefix={`${t('transfer.gasFee')} ${fromNano(amount)} TON (`}
                                        suffix={')'}
                                        amount={amount}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0,
                                            marginLeft: 2
                                        }}
                                        textStyle={{
                                            color: '#858B93',
                                            fontWeight: '400', fontSize: 14
                                        }}
                                    />
                                )}
                                {AppConfig.isTestnet && (
                                    <Text style={{
                                        color: '#858B93',
                                        fontWeight: '400', fontSize: 14,
                                        lineHeight: 16
                                    }}>
                                        {`${t('transfer.gasFee')} ${fromNano(amount)} TON`}
                                    </Text>
                                )}
                                <View style={{
                                    backgroundColor: Theme.item,
                                    shadowColor: 'rgba(0, 0, 0, 0.25)',
                                    shadowOffset: {
                                        height: 1,
                                        width: 0
                                    },
                                    shadowRadius: 3,
                                    shadowOpacity: 1,
                                    height: 24, width: 24,
                                    borderRadius: 24,
                                    position: 'absolute', top: 0, bottom: 0, left: -40,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <TonSignGas />
                                </View>
                            </View>
                        </>
                    )}
                    {(!!transfer.contact || !!transfer.known) && (
                        <View style={{
                            marginLeft: 40 + 6,
                            minHeight: 40,
                            justifyContent: 'center'
                        }}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 20,
                                    color: Theme.textColor,
                                    marginLeft: 2,
                                }}>
                                    {`${transfer.contact?.name ?? transfer.known?.name}`}
                                </Text>
                                {transfer.known && (
                                    <VerifiedIcon
                                        width={20}
                                        height={20}
                                        style={{ alignSelf: 'center', marginLeft: 6 }}
                                    />
                                )}
                            </View>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 14,
                                color: '#858B93',
                                marginLeft: 2,
                                marginTop: 4
                            }}>
                                <AddressComponent address={transfer.message.addr.address} />
                            </Text>
                            {!transfer.message.addr.active && !transfer.message.stateInit && (
                                <>
                                    <Pressable
                                        onPress={inactiveAlert}
                                        style={({ pressed }) => {
                                            return {
                                                alignSelf: 'flex-start',
                                                flexDirection: 'row',
                                                borderRadius: 6, borderWidth: 1,
                                                borderColor: '#FFC165',
                                                paddingHorizontal: 8, paddingVertical: 4,
                                                marginTop: 4,
                                                justifyContent: 'center', alignItems: 'center',
                                                opacity: pressed ? 0.3 : 1
                                            }
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '400',
                                            color: '#E19626'
                                        }}>
                                            {t('transfer.error.addressIsNotActive')}
                                        </Text>
                                        <Question style={{ marginLeft: 5 }} />
                                    </Pressable>
                                </>
                            )}
                            {transfer.contact && (
                                <>
                                    <View style={{
                                        position: 'absolute',
                                        left: -48, top: 0, bottom: 0,
                                        backgroundColor: '#EDA652',
                                        height: 40, width: 40,
                                        borderRadius: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 36
                                    }}>
                                        <Contact />
                                    </View>
                                    <View style={{
                                        alignSelf: 'flex-start',
                                        borderRadius: 6, borderWidth: 1,
                                        borderColor: '#DEDEDE',
                                        paddingHorizontal: 8, paddingVertical: 4,
                                        marginTop: 4
                                    }}>
                                        <Text>
                                            {t('transfer.contact')}
                                        </Text>
                                    </View>
                                </>
                            )}
                            {!transfer.contact && (
                                <View style={{
                                    position: 'absolute',
                                    left: -48, top: 0, bottom: 0,
                                    height: 40, width: 40,
                                }}>
                                    <Avatar
                                        address={friendlyTarget}
                                        id={friendlyTarget}
                                        size={40}
                                        spam={transfer.spam}
                                        dontShowVerified={true}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                    {(!transfer.contact && !transfer.known) && (
                        <View style={{
                            marginLeft: 40 + 6,
                            minHeight: 40,
                            justifyContent: 'center'
                        }}>
                            <Text style={{
                                fontWeight: '700',
                                fontSize: 20,
                                color: Theme.textColor,
                                marginLeft: 2
                            }}>
                                <AddressComponent address={transfer.message.addr.address} />
                            </Text>
                            <View style={{
                                position: 'absolute',
                                left: -48, top: 0, bottom: 0,
                                height: 40, width: 40,
                            }}>
                                <Avatar
                                    address={friendlyTarget}
                                    id={friendlyTarget}
                                    size={40}
                                    spam={transfer.spam}
                                    dontShowVerified={true}
                                />
                            </View>
                            {!transfer.message.addr.active && !transfer.message.stateInit && (
                                <>
                                    <Pressable
                                        onPress={inactiveAlert}
                                        style={({ pressed }) => {
                                            return {
                                                alignSelf: 'flex-start',
                                                flexDirection: 'row',
                                                borderRadius: 6, borderWidth: 1,
                                                borderColor: '#FFC165',
                                                paddingHorizontal: 8, paddingVertical: 4,
                                                marginTop: 4,
                                                justifyContent: 'center', alignItems: 'center',
                                                opacity: pressed ? 0.3 : 1
                                            }
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '400',
                                            color: '#E19626'
                                        }}>
                                            {t('transfer.error.addressIsNotActive')}
                                        </Text>
                                        <Question style={{ marginLeft: 5 }} />
                                    </Pressable>
                                </>
                            )}
                        </View>
                    )}

                    {/* TODO: smart contract handling */}
                </View>
            </View>
            <ItemGroup style={{ marginTop: 8 }}>
                <ItemCollapsible title={t('transfer.moreDetails')}>
                    <ItemAddress
                        title={t('common.walletAddress')}
                        text={transfer.operation.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        verified={!!transfer.known}
                        contact={!!transfer.contact}
                        secondary={transfer.known ? transfer.known.name : transfer.contact?.name ?? undefined}
                    />
                    {!!transfer.operation.op && (
                        <>
                            <ItemDivider />
                            <ItemLarge title={t('transfer.purpose')} text={transfer.operation.op} />
                        </>
                    )}
                    {!transfer.operation.comment && !transfer.operation.op && transfer.message.payload && (
                        <>
                            <ItemDivider />
                            <ItemLarge title={t('transfer.unknown')} text={Cell.fromBoc(Buffer.from(transfer.message.payload, 'base64'))[0].hash().toString('base64')} />
                        </>
                    )}
                    {!!transfer.jettonAmount && (
                        <>
                            <ItemDivider />
                            <ItemLarge title={t('transfer.gasFee')} text={fromNano(transfer.message.amount) + ' TON'} />
                        </>
                    )}
                </ItemCollapsible>
            </ItemGroup>
            {!!last && <View style={{ height: 16 }} />}
        </>
    );
});