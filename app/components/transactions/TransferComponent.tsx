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

export const TransferComponent = React.memo(({ transfer, last, first, index }: {
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
    last?: boolean,
    index?: number,
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
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 14,
                marginBottom: last ? 20 : 16,
                marginTop: first ? 16 : 0,
            }}>
                <Text style={{
                    color: Theme.textSubtitle,
                    fontSize: 14,
                    marginRight: 14,
                    marginTop: 2,
                    includeFontPadding: false,
                }}>
                    {`# ${index}`}
                </Text>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
                        {!transfer.jettonAmount && (
                            <View>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 17,
                                    color: Theme.textColor,
                                    includeFontPadding: false,
                                }}>
                                    {`${fromNano(amount)} TON`}
                                </Text>
                                <PriceComponent
                                    prefix={'~'}
                                    amount={amount}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0,
                                        marginTop: 4
                                    }}
                                    textStyle={{ color: Theme.textColor, fontWeight: '400', fontSize: 14 }}
                                />
                            </View>
                        )}
                        {!!transfer.jettonAmount && transfer.jettonMaster && (
                            <View>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 17,
                                    color: Theme.textColor,
                                    includeFontPadding: false,
                                }}>
                                    {`${fromNano(transfer.jettonAmount)} ${transfer.jettonMaster.symbol}`}
                                </Text>
                            </View>
                        )}

                        <View style={{
                            flexDirection: 'row',
                        }}>
                            <TransferToArrow
                                style={{
                                    transform: [{ rotate: '-90deg' }],
                                    marginRight: 20
                                }}
                            />

                            <View style={{ width: 126 }}>
                                {(!!transfer.contact || !!transfer.known) && (
                                    <>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{
                                                fontWeight: '700',
                                                fontSize: 17,
                                                color: Theme.textColor,
                                                includeFontPadding: false,
                                            }}
                                                numberOfLines={1}
                                            >
                                                {`${transfer.contact?.name ?? transfer.known?.name}`}
                                            </Text>
                                        </View>
                                        <Text style={{
                                            fontWeight: '400',
                                            fontSize: 14,
                                            color: '#858B93',
                                            marginTop: 4,
                                            includeFontPadding: false,
                                        }}>
                                            <AddressComponent
                                                start={4}
                                                end={4}
                                                address={transfer.operation.address}
                                            />
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
                                            <View style={{
                                                alignSelf: 'flex-start',
                                                borderRadius: 6, borderWidth: 1,
                                                borderColor: '#DEDEDE',
                                                paddingHorizontal: 8, paddingVertical: 4,
                                            }}>
                                                <Text>
                                                    {t('transfer.contact')}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                                {!transfer.contact && !transfer.known && (
                                    <>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 17,
                                            color: Theme.textColor,
                                            includeFontPadding: false,
                                        }}>
                                            <AddressComponent
                                                start={4}
                                                end={4}
                                                address={transfer.operation.address}
                                            />
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
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                    {!!transfer.operation.comment && transfer.operation.comment.length > 0 && (
                        <View style={{ alignItems: 'baseline' }}>
                            <View style={{
                                backgroundColor: Theme.background,
                                padding: 10,
                                borderRadius: 6,
                                marginTop: 8,
                                flex: 1,
                                flexShrink: 1,
                            }}>
                                <Text>
                                    {`💬 ${transfer.operation.comment}`}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
            {!last && <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginBottom: 16 }} />}
        </>
    );
});