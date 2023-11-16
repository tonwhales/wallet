import React from "react";
import { memo, useCallback } from "react";
import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { ItemGroup } from "../../../components/ItemGroup";
import { PriceComponent } from "../../../components/PriceComponent";
import { ValueComponent } from "../../../components/ValueComponent";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { WImage } from "../../../components/WImage";
import { LedgerOrder, Order } from "../ops/Order";
import { KnownWallet } from "../../../secure/KnownWallets";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Address, fromNano, toNano } from "@ton/core";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { useSelectedAccount, useTheme } from "../../../engine/hooks";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { holdersUrl } from "../../../engine/api/holders/fetchAccountState";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { StoredOperation } from "../../../engine/types";

import TonSign from '@assets/ic_ton_sign.svg';
import WithStateInit from '@assets/ic_sign_contract.svg';
import IcAlert from '@assets/ic-alert.svg';
import IcInfo from '@assets/ic-info.svg';
import SignLock from '@assets/ic_sign_lock.svg';

export const TransferSingleView = memo(({
    operation,
    order,
    amount,
    text,
    jettonAmountString,
    target,
    fees,
    jettonMaster,
    doSend,
    walletSettings,
    known,
    isSpam,
    isWithStateInit,
    isLedger
}: {
    operation: StoredOperation,
    order: Order | LedgerOrder,
    amount: bigint,
    jettonAmountString: string | undefined,
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: bigint;
        active: boolean;
        domain?: string | undefined;
    },
    fees: bigint,
    jettonMaster: JettonMasterState | null,
    doSend?: () => Promise<void>,
    walletSettings: WalletSettings | null,
    text: string | null,
    known: KnownWallet | undefined,
    isSpam: boolean,
    isWithStateInit?: boolean,
    isLedger?: boolean
}) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();

    const from = isLedger ? Address.parse(ledgerContext.addr!.address) : selected!.address;

    const inactiveAlert = useCallback(() => {
        navigation.navigateAlert({
            title: t('transfer.error.addressIsNotActive'),
            message: t('transfer.error.addressIsNotActiveDescription')
        });
    }, []);

    const feesAlert = useCallback(() => {
        navigation.navigateAlert({
            title: t('transfer.aboutFees', { amount: fromNano(fees) }),
            message: t('transfer.aboutFeesDescription')
        });
    }, []);

    const jettonsGasAlert = useCallback(() => {
        if (!jettonAmountString) return;
        navigation.navigateAlert({
            title: t('transfer.unusualJettonsGasTitle', { amount: fromNano(amount) }),
            message: t('transfer.unusualJettonsGasMessage')
        });
    }, [amount, jettonAmountString]);


    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    {!!order.app && (
                        <View style={{
                            marginTop: 8,
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                        }}>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                flexShrink: 1,
                            }}>
                                {t('transfer.requestsToSign', { app: order.app.title })}
                            </Text>
                            <View style={{
                                alignItems: 'center',
                                flexDirection: 'row',
                                flexShrink: 1,
                            }}>
                                <SignLock />
                                <Text style={{
                                    textAlign: 'center',
                                    fontSize: 14,
                                    fontWeight: '400',
                                    marginLeft: 4,
                                    color: theme.textSecondary
                                }}>
                                    {order.app.domain}
                                </Text>
                            </View>
                        </View>
                    )}
                    <ItemGroup style={{ marginBottom: 16, marginTop: 16, paddingTop: 27 }}>
                        <View style={{
                            backgroundColor: theme.divider,
                            height: 54,
                            position: 'absolute', left: 0, right: 0
                        }} />
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 68, flexDirection: 'row', height: 68 }}>
                                {!!jettonAmountString && (
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            height: 68, width: 68,
                                            borderRadius: 34,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <WImage
                                            src={jettonMaster?.image?.preview256}
                                            blurhash={jettonMaster?.image?.blurhash}
                                            width={64}
                                            heigh={64}
                                            borderRadius={32}
                                        />
                                    </View>
                                )}
                                {!jettonAmountString && (
                                    <View style={{
                                        backgroundColor: 'white',
                                        height: 68, width: 68,
                                        borderRadius: 34,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                        <View style={{
                                            backgroundColor: theme.ton,
                                            height: 64, width: 64,
                                            borderRadius: 32,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            <TonSign height={26} width={26} color={'white'} />
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 17, lineHeight: 24, fontWeight: '600',
                                color: theme.textPrimary,
                                marginTop: 8
                            }}>
                                {t('common.send')}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {!jettonAmountString && (
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 32, lineHeight: 38,
                                    color: theme.textPrimary
                                }}>
                                    {fromNano(amount) + ' TON'}
                                </Text>
                            )}
                            {!!jettonAmountString && (
                                <Text
                                    style={{
                                        fontWeight: '600',
                                        fontSize: 32, lineHeight: 38,
                                        color: theme.textPrimary
                                    }}
                                >
                                    {`${jettonAmountString} ${jettonMaster?.symbol ?? ''}`}
                                </Text>
                            )}
                        </View>
                        {!jettonAmountString && (
                            <PriceComponent
                                amount={amount}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0, marginTop: 2,
                                    alignSelf: 'center'
                                }}
                                textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 17, lineHeight: 24 }}
                            />
                        )}
                    </ItemGroup>

                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                    <AddressComponent address={from} end={4} />
                                </Text>
                                {walletSettings?.name && (
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {walletSettings.name}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.to')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                    <AddressComponent address={target.address} end={4} />
                                </Text>
                                <View style={{ flexDirection: 'row' }}>
                                    {!!known && (
                                        <>
                                            <Text
                                                style={{
                                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                    color: theme.textSecondary,
                                                    flexShrink: 1
                                                }}
                                                numberOfLines={1}
                                                ellipsizeMode={'tail'}
                                            >
                                                {known?.name.length > 16 ? known?.name.slice(0, 16) + '...' : known?.name}
                                            </Text>
                                            <Image
                                                source={require('@assets/ic-verified.png')}
                                                style={{
                                                    height: 18, width: 18,
                                                    marginLeft: 6
                                                }}
                                            />
                                        </>
                                    )}
                                    {!!order.domain && (
                                        <Text
                                            style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {`${!!known ? ' • ' : ''}${order.domain.length > 16 ? order.domain.slice(0, 16) + '...' : order.domain}`}
                                        </Text>
                                    )}
                                </View>
                                {(!target.active && !isWithStateInit) && (
                                    <Pressable
                                        style={{ flexDirection: 'row' }}
                                        onPress={inactiveAlert}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {t('transfer.addressNotActive')}
                                        </Text>
                                        <IcAlert style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                    </Pressable>
                                )}
                                {isSpam && (
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text
                                            style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {'SPAM'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        {!!operation.op && !jettonAmountString && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('transfer.smartContract')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {order?.app?.domain !== extractDomain(holdersUrl) ? (
                                            <View style={{
                                                backgroundColor: theme.surfaceOnBg,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        ) : (
                                            <View style={{
                                                height: 46, width: 34,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <Image
                                                    style={{ height: 46, width: 34 }}
                                                    source={require('@assets/ic_sign_card.png')}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}
                        {!operation.comment && !operation.op && !!text && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('transfer.smartContract')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {order?.app?.domain !== extractDomain(holdersUrl) ? (
                                            <View style={{
                                                backgroundColor: theme.surfaceOnBg,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        ) : (
                                            <View style={{
                                                height: 46, width: 34,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <Image
                                                    style={{ height: 46, width: 34, }}
                                                    source={require('@assets/ic_sign_card.png')}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}
                        {!!operation.op && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('transfer.purpose')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary, textAlign: 'right' }}>
                                            {t(operation.op.res, operation.op.options)}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {!!text && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'column', paddingHorizontal: 10 }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('transfer.comment')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-start', flexShrink: 1, marginTop: 2 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary, textAlign: 'right' }}>
                                            {text}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {!!jettonAmountString && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('transfer.gasFee')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                            {fromNano(amount) + ' TON'}
                                        </Text>
                                    </View>

                                    {(amount > toNano('0.2')) && (
                                        <Pressable
                                            onPress={jettonsGasAlert}
                                            style={({ pressed }) => {
                                                return {
                                                    alignSelf: 'flex-start',
                                                    flexDirection: 'row',
                                                    width: '100%',
                                                    borderRadius: 12,
                                                    marginTop: 16,
                                                    paddingLeft: 16, paddingRight: 14, paddingVertical: 12,
                                                    justifyContent: 'space-between', alignItems: 'center',
                                                    backgroundColor: 'white',
                                                    opacity: pressed ? 0.5 : 1
                                                };
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 15, lineHeight: 20,
                                                fontWeight: '400',
                                                color: theme.accentRed
                                            }}>
                                                {t('transfer.unusualJettonsGas')}
                                            </Text>
                                            <IcAlert style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                        </Pressable>
                                    )}
                                </View>
                            </>
                        )}
                    </ItemGroup>
                    <ItemGroup>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Pressable
                                onPress={feesAlert}
                                style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('transfer.feeTitle')}
                                </Text>
                                <IcInfo
                                    height={16} width={16}
                                    style={{ height: 16, width: 16, marginLeft: 10 }}
                                    color={theme.iconPrimary} />
                            </Pressable>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                    <ValueComponent
                                        value={fees}
                                        precision={6} />
                                    {' TON'}
                                </Text>
                                <PriceComponent
                                    amount={fees}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                        flexShrink: 1
                                    }} />
                            </View>
                        </View>
                    </ItemGroup>
                    <View style={{ height: 54 }} />
                </View>
            </ScrollView>
            {!!doSend && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <RoundButton
                        title={t('common.confirm')}
                        action={doSend} />
                </View>
            )}
        </View>
    )
})