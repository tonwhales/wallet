import React, { memo, useMemo } from "react";
import { View, Text, Image, useWindowDimensions, TouchableHighlight } from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "@ton/core";
import { PriceComponent } from "../../../components/PriceComponent";
import { ValueComponent } from "../../../components/ValueComponent";
import { WalletAddress } from "../../../components/WalletAddress";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useTheme } from '../../../engine/hooks';
import { TonTransport } from '@ton-community/ton-ledger';
import { useNetwork } from '../../../engine/hooks';
import { useAccountTransactions } from '../../../engine/hooks';
import { useClient4 } from '../../../engine/hooks';
import { useAccountLite } from '../../../engine/hooks';
import { WalletTransactions } from "../../wallet/views/WalletTransactions";

export const LedgerApp = memo((props: {
    transport: TonTransport,
    account: number,
    address: { address: string, publicKey: Buffer },
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const window = useWindowDimensions();
    const client4 = useClient4(isTestnet);

    const address = useMemo(() => Address.parse(props.address.address), [props.address.address]);
    const account = useAccountLite(address);
    const transactions = useAccountTransactions(client4, props.address.address);

    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);

    return (
        <View style={{ flexGrow: 1 }}>
            <WalletTransactions
                txs={transactions?.data || []}
                hasNext={transactions?.hasNext || false}
                loading={transactions?.loading || false}
                onLoadMore={transactions?.next || (() => { })}
                address={address}
                navigation={navigation}
                safeArea={safeArea}
                frameArea={frameArea}
                sectionedListProps={{
                    contentInset: { top: 0, bottom: safeArea.bottom + 32 },
                    contentOffset: { y: -(44 + safeArea.top), x: 0 },
                }}
                header={
                    <View>
                        <View
                            style={{
                                marginHorizontal: 16, marginVertical: 16,
                                height: cardHeight,
                            }}
                            collapsable={false}
                        >
                            <Image
                                source={require('../../../../assets/staking_card.png')}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: cardHeight,
                                    width: window.width - 32
                                }}
                                resizeMode="stretch"
                                resizeMethod="resize"
                            />
                            <Text style={{
                                fontSize: 14,
                                color: 'white',
                                opacity: 0.8,
                                marginTop: 22,
                                marginLeft: 22
                            }}>
                                {t('wallet.balanceTitle')}
                            </Text>
                            <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                                <ValueComponent
                                    value={account?.balance ?? toNano('0')}
                                    centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                                />
                            </Text>
                            <PriceComponent amount={account?.balance ?? toNano('0')} style={{ marginHorizontal: 22, marginTop: 6 }} />
                            <View style={{ flexGrow: 1 }} />
                            <WalletAddress
                                value={address.toString({ testOnly: isTestnet })}
                                address={address}
                                elipsise
                                style={{
                                    marginLeft: 22,
                                    marginBottom: 16,
                                    alignSelf: 'flex-start',
                                }}
                                textStyle={{
                                    textAlign: 'left',
                                    color: 'white',
                                    fontWeight: '500',
                                    fontFamily: undefined
                                }}
                                disableContextMenu
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                marginHorizontal: 16,
                            }}
                            collapsable={false}
                        >
                            <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                                <TouchableHighlight
                                    onPress={() => {
                                        navigation.navigate(
                                            'LedgerReceive',
                                            {
                                                addr: props.address.address,
                                                ledger: true
                                            }
                                        );
                                    }}
                                    underlayColor={theme.surfaceSecondary}
                                    style={{ borderRadius: 14 }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                        <View style={{ backgroundColor: theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../../../../assets/ic_receive.png')} />
                                        </View>
                                        <Text style={{ fontSize: 13, color: theme.accent, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                                    </View>
                                </TouchableHighlight>
                            </View>
                            <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', borderRadius: 14 }}>
                                <TouchableHighlight
                                    onPress={() => navigation.navigate('LedgerAssets')}
                                    underlayColor={theme.surfaceSecondary} style={{ borderRadius: 14 }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                        <View style={{ backgroundColor: theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../../../../assets/ic_send.png')} />
                                        </View>
                                        <Text style={{ fontSize: 13, color: theme.accent, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                                    </View>
                                </TouchableHighlight>
                            </View>
                        </View>
                    </View>
                }
            />
        </View>
    );
});