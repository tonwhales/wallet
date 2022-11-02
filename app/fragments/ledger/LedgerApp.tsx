import BN from "bn.js";
import React from "react";
import { View, Text, Image, useWindowDimensions, ScrollView, Platform } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { delay } from "teslabot";
import { Address, fromNano, toNano, TonClient4 } from "ton";
import { TonTransport } from "ton-ledger";
import { AppConfig } from "../../AppConfig";
import { AddressComponent } from "../../components/AddressComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { t } from "../../i18n/t";
import { backoff } from "../../utils/time";
import { LedgerTransferComponent } from "./LedgerTransferComponent";

export const LedgerApp = React.memo((props: { transport: TonTransport, account: number, address: { address: string, publicKey: Buffer }, reset: () => void, tonClient4: TonClient4 }) => {
    const address = React.useMemo(() => Address.parse(props.address.address), [props.address.address]);
    const window = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);

    const [balance, setBalance] = React.useState<BN | null>(null);
    React.useEffect(() => {
        let exited = false;
        backoff('ledger-app', async () => {
            while (true) {
                let seqno = (await props.tonClient4.getLastBlock()).last.seqno;
                let acc = await props.tonClient4.getAccountLite(seqno, Address.parse(props.address.address));
                setBalance(new BN(acc.account.balance.coins, 10));
                await delay(1000);
            }
        });

        return () => {
            exited = true;
        };
    }, []);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>{Platform.OS === 'ios' && (<View style={{ height: safeArea.top }} />)}
            <View
                style={[
                    {
                        marginHorizontal: 16, marginVertical: 16,
                        height: cardHeight,
                    }
                ]}
                collapsable={false}
            >
                <Image
                    source={require('../../../assets/staking_card.png')}
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
                <Text
                    style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}
                >
                    {t('wallet.balanceTitle')}
                </Text>
                <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                    <ValueComponent
                        value={balance ?? toNano('0')}
                        centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                    />
                </Text>
                <PriceComponent amount={balance ?? toNano('0')} style={{ marginHorizontal: 22, marginTop: 6 }} />
                <View style={{ flexGrow: 1 }} />
                <WalletAddress
                    value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
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
                />
            </View>
            <LedgerTransferComponent
                transport={props.transport}
                account={props.account}
                addr={props.address}
                tonClient4={props.tonClient4} />
        </View>
    );
});