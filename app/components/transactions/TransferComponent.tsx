import React, { memo } from "react"
import { View, Text, Pressable, Alert } from "react-native";
import { PriceComponent } from "../PriceComponent";
import TransferToArrow from '../../../assets/ic_transfer_to.svg';
import Question from '../../../assets/ic_question.svg';
import { Address, Cell, fromNano } from "@ton/core";
import { AddressComponent } from "../AddressComponent";
import { ContractMetadata } from "../../engine/metadata/Metadata";
import { KnownWallet } from "../../secure/KnownWallets";
import { t } from "../../i18n/t";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { useTheme } from '../../engine/hooks';
import { JettonMasterState } from '../../engine/metadata/fetchJettonMasterContent';
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { Operation } from '../../engine/transactions/types';

export const TransferComponent = memo(({ transfer, last, first, index }: {
    transfer: {
        message: {
            addr: {
                address: Address,
                balance: bigint,
                active: boolean,
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: bigint,
            amountAll: boolean,
            payload: Cell | null,
            stateInit: Cell | null,
        },
        operation: Operation,
        parsedBody: any | null,
        known?: KnownWallet,
        spam: boolean,
        jettonAmount: bigint | null,
        contact?: AddressContact,
        jettonMaster: JettonMasterState | null
    },
    first?: boolean,
    last?: boolean,
    index: number,
}) => {
    const theme = useTheme();
    const amount = transfer.message.amount;
    const inactiveAlert = React.useCallback(() => {
        Alert.alert(t('transfer.error.addressIsNotActive'),
            t('transfer.error.addressIsNotActiveDescription'),
            [{ text: t('common.gotIt') }])
    }, [],);

    return (
        <>
            <View
                key={`transfer-view-${index}`}
                style={{
                    flexDirection: 'row',
                    paddingHorizontal: 14,
                    marginBottom: last ? 20 : 16,
                    marginTop: first ? 16 : 0,
                }}
            >
                <Text style={{
                    color: theme.textThird,
                    fontSize: 14,
                    marginRight: 14,
                    marginTop: 2,
                    includeFontPadding: false,
                }}>
                    {`#${index + 1}`}
                </Text>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
                        {!transfer.jettonAmount && (
                            <View>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 17,
                                    color: theme.textPrimary,
                                    includeFontPadding: false,
                                }}>
                                    {`${fromNano(amount)} TON`}
                                </Text>
                                <PriceComponent
                                    amount={amount}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        marginTop: 4
                                    }}
                                    textStyle={{ color: theme.textPrimary, fontWeight: '400', fontSize: 14 }}
                                />
                            </View>
                        )}
                        {!!transfer.jettonAmount && transfer.jettonMaster && (
                            <View>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 17,
                                    color: theme.textPrimary,
                                    includeFontPadding: false,
                                }}>
                                    {`${fromBnWithDecimals(transfer.jettonAmount, transfer.jettonMaster.decimals)} ${transfer.jettonMaster.symbol}`}
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
                                                color: theme.textPrimary,
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
                                            color: theme.textSecondary,
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
                                                            borderColor: theme.warning,
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
                                                        color: theme.warning
                                                    }}>
                                                        {t('transfer.addressNotActive')}
                                                    </Text>
                                                    <Question style={{ marginLeft: 5 }} />
                                                </Pressable>
                                            </>
                                        )}
                                        {transfer.contact && (
                                            <View style={{
                                                alignSelf: 'flex-start',
                                                borderRadius: 6, borderWidth: 1,
                                                borderColor: theme.accentBlue,
                                                paddingHorizontal: 8, paddingVertical: 4,
                                                marginTop: 8
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
                                            color: theme.textPrimary,
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
                                                            borderColor: theme.warning,
                                                            paddingHorizontal: 8, paddingVertical: 4,
                                                            marginTop: 6,
                                                            justifyContent: 'center', alignItems: 'center',
                                                            opacity: pressed ? 0.3 : 1
                                                        }
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: 14,
                                                        fontWeight: '400',
                                                        color: theme.warning
                                                    }}>
                                                        {t('transfer.addressNotActive')}
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
                                backgroundColor: theme.background,
                                padding: 10,
                                borderRadius: 6,
                                marginTop: 8,
                            }}>
                                <Text>
                                    {`💬 ${transfer.operation.comment}`}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
            {!last && (
                <View
                    key={`transfer-divider-${index}`}
                    style={{
                        height: 1,
                        alignSelf: 'stretch',
                        backgroundColor: theme.divider,
                        marginBottom: 16
                    }}
                />
            )}

        </>
    );
});