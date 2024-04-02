import React, { useMemo } from "react";
import { memo, useCallback } from "react";
import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { ItemGroup } from "../../../components/ItemGroup";
import { PriceComponent } from "../../../components/PriceComponent";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { LedgerOrder, Order } from "../ops/Order";
import { KnownWallet } from "../../../secure/KnownWallets";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Address, fromNano, toNano } from "@ton/core";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { useAppState, useNetwork, useBounceableWalletFormat, usePrice, useSelectedAccount, useTheme, useWalletsSettings } from "../../../engine/hooks";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { holdersUrl } from "../../../engine/api/holders/fetchAccountState";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { StoredOperation } from "../../../engine/types";
import { AboutIconButton } from "../../../components/AboutIconButton";
import { formatAmount, formatCurrency } from "../../../utils/formatCurrency";
import { Avatar, avatarColors } from "../../../components/avatar/Avatar";
import { AddressContact } from "../../../engine/hooks/contacts/useAddressBook";
import { valueText } from "../../../components/ValueComponent";
import { toBnWithDecimals } from "../../../utils/withDecimals";
import { avatarHash } from "../../../utils/avatarHash";

import WithStateInit from '@assets/ic_sign_contract.svg';
import IcAlert from '@assets/ic-alert.svg';
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
    isLedger,
    contact
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
        bounceable?: boolean | undefined;
    },
    fees: bigint,
    jettonMaster: JettonMasterState | null,
    doSend?: () => Promise<void>,
    walletSettings: WalletSettings | null,
    text: string | null,
    known: KnownWallet | undefined,
    isSpam: boolean,
    isWithStateInit?: boolean,
    isLedger?: boolean,
    contact?: AddressContact | null
}) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const ledgerTransport = useLedgerTransport();
    const appState = useAppState();
    const [walletsSettings,] = useWalletsSettings();
    const [price, currency] = usePrice();
    const [bounceableFormat,] = useBounceableWalletFormat();

    const targetString = target.address.toString({ testOnly: isTestnet });
    const targetWalletSettings = walletsSettings[targetString];

    const avatarColorHash = targetWalletSettings?.color ?? avatarHash(targetString, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const feesPrise = useMemo(() => {
        if (!price) {
            return undefined;
        }

        const isNeg = fees < 0n;
        const abs = isNeg ? -fees : fees;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(3),
            currency,
            isNeg
        );
    }, [price, currency, fees]);

    const isTargetLedger = useMemo(() => {
        try {
            if (!!ledgerTransport?.addr?.address) {
                return Address.parse(ledgerTransport.addr.address).equals(target.address);
            }
            return false
        } catch {
            return false;
        }
    }, [ledgerTransport.addr?.address, target.address]);

    const fromAddress = isLedger ? Address.parse(ledgerTransport.addr!.address) : selected!.address;
    const name = isLedger
        ? 'Ledger'
        : `${t('common.wallet')} ${appState.addresses.findIndex((a) => fromAddress?.equals(a.address)) + 1}`;

    const from = {
        address: fromAddress,
        name: walletSettings?.name || name
    }

    const to = {
        address: target.address,
        name:
            isTargetLedger
                ? 'Ledger'
                : targetWalletSettings?.name
                || known?.name
                || target.domain
                || null
    }

    const jettonsGasAlert = useCallback(() => {
        if (!jettonAmountString) return;
        navigation.navigateAlert({
            title: t('transfer.unusualJettonsGasTitle', { amount: fromNano(amount) }),
            message: t('transfer.unusualJettonsGasMessage')
        });
    }, [amount, jettonAmountString]);

    const amountText = useMemo(() => {
        const decimals = jettonMaster?.decimals ?? 9;
        const textArr = valueText(
            jettonAmountString
                ? { value: toBnWithDecimals(jettonAmountString, decimals), decimals }
                : { value: amount, decimals: 9 }
        );
        return `-${textArr.join('')} ${!jettonAmountString ? 'TON' : jettonMaster?.symbol ?? ''}`
    }, [amount, jettonAmountString, jettonMaster]);

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
                                color: theme.textPrimary
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
                                {isTargetLedger ? (
                                    <Image
                                        source={require('@assets/ledger_device.png')}
                                        style={{ height: 68, width: 68 }}
                                    />
                                ) : (
                                    <Avatar
                                        size={68}
                                        id={targetString}
                                        address={targetString}
                                        hash={targetWalletSettings?.avatar}
                                        spam={isSpam}
                                        showSpambadge
                                        borderWith={2}
                                        borderColor={theme.surfaceOnElevation}
                                        backgroundColor={avatarColor}
                                        markContact={!!contact}
                                        icProps={{ position: 'bottom' }}
                                        theme={theme}
                                        isTestnet={isTestnet}
                                    />
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
                            <Text style={{
                                fontSize: 17, lineHeight: 24, fontWeight: '400',
                                color: theme.textPrimary,
                                marginTop: 2
                            }}>
                                <AddressComponent
                                    bounceable={target.bounceable}
                                    address={target.address}
                                    end={4}
                                    testOnly={isTestnet}
                                    known={!!known}
                                />
                                {isTargetLedger && ' (Ledger)'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Text
                                minimumFontScale={0.4}
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                style={{
                                    color: theme.textPrimary,
                                    fontWeight: '600',
                                    fontSize: 27,
                                    marginTop: 12,
                                    lineHeight: 32
                                }}
                            >
                                {amountText}
                            </Text>
                        </View>
                        {!jettonAmountString && (
                            <PriceComponent
                                amount={amount}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0, marginTop: 2,
                                    alignSelf: 'center',
                                    paddingLeft: 0
                                }}
                                prefix={'-'}
                                textStyle={{
                                    color: theme.textSecondary,
                                    fontWeight: '400',
                                    fontSize: 17,
                                    lineHeight: 24,
                                }}
                                theme={theme}
                            />
                        )}
                    </ItemGroup>

                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={{
                                fontSize: 13, lineHeight: 18, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                    {!!from.name && (
                                        <Text
                                            style={{
                                                fontSize: 17, lineHeight: 24, fontWeight: '400',
                                                color: theme.textPrimary,
                                                flexShrink: 1
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {from.name + ' '}
                                        </Text>
                                    )}
                                    <Text style={{ color: from.name ? theme.textSecondary : theme.textPrimary, }}>
                                        <AddressComponent
                                            address={fromAddress}
                                            end={4}
                                            bounceable={bounceableFormat}
                                            testOnly={isTestnet}
                                        />
                                    </Text>
                                </Text>
                            </View>
                        </View>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={{
                                fontSize: 13, lineHeight: 18, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.to')}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={{
                                        fontSize: 17, fontWeight: '400', lineHeight: 24,
                                        color: theme.textSecondary,
                                    }}
                                >
                                    <Text style={{ color: theme.textPrimary }}>
                                        {to.address.toString({ testOnly: isTestnet, bounceable: target.bounceable }).replaceAll('-', '\u2011')}
                                    </Text>
                                </Text>
                            </View>
                            {!target.active && (
                                <Pressable
                                    style={({ pressed }) => ({ flexDirection: 'row', marginTop: 4, opacity: pressed ? 0.5 : 1 })}
                                    onPress={() => {
                                        navigation.navigateAlert({
                                            title: t('transfer.error.addressIsNotActive'),
                                            message: t('transfer.error.addressIsNotActiveDescription')
                                        })
                                    }}
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
                                        <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary, textAlign: 'right' }}>
                                            {t(operation.op.res, operation.op.options)}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {!!jettonAmountString && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                                        <Text style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                        }}>
                                            {t('transfer.gasFee')}
                                        </Text>
                                        <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 }}>
                                            <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                                {fromNano(amount) + ' TON'}
                                            </Text>
                                        </View>
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
                                                    opacity: pressed ? 0.5 : 1,
                                                    overflow: 'hidden'
                                                };
                                            }}
                                        >
                                            <Text style={{
                                                flexShrink: 1,
                                                flexGrow: 1,
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
                    {text && text.length > 0 && (
                        <ItemGroup style={{ marginBottom: 16 }}>
                            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('common.message')}
                                </Text>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                        {text}
                                    </Text>
                                </View>
                            </View>
                        </ItemGroup>
                    )}
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        padding: 20, borderRadius: 20,
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <View>
                            <Text
                                style={{
                                    color: theme.textSecondary,
                                    fontSize: 13, lineHeight: 18, fontWeight: '400',
                                    marginBottom: 2
                                }}>
                                {t('txPreview.blockchainFee')}
                            </Text>
                            <Text style={{
                                color: theme.textPrimary,
                                fontSize: 17, lineHeight: 24, fontWeight: '400'
                            }}>
                                {`${formatAmount(fromNano(fees))}`}
                                {feesPrise && (
                                    <Text style={{ color: theme.textSecondary }}>
                                        {` ${feesPrise}`}
                                    </Text>
                                )}
                            </Text>
                        </View>
                        <AboutIconButton
                            title={t('txPreview.blockchainFee')}
                            description={t('txPreview.blockchainFeeDescription')}
                            style={{ height: 24, width: 24, position: undefined, marginRight: 4 }}
                            size={24}
                        />
                    </View>
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