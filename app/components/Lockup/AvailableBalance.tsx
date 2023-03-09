import React from "react"
import { TouchableHighlight, Text, View, useWindowDimensions } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import TonSign from '../../../assets/ic_ton_sign.svg';
import LockupMark from '../../../assets/ic_lock_mark.svg';
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync";
import BN from "bn.js";

export const AvailableBalance = React.memo(({ address, lockup }: { address: Address, lockup: LockupWalletState }) => {
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;
    const friendly = address.toFriendly({ testOnly: AppConfig.isTestnet });
    const liquid = React.useMemo(() => {
        let balance = new BN(0);
        balance = balance.add(lockup.balance);

        if (lockup.wallet?.locked) {
            Array.from(lockup.wallet.locked).forEach(([key, value]) => {
                const until = parseInt(key);
                if (until <= Date.now() / 1000) {
                    balance = balance.add(new BN(value));
                }
            });
        }

        if (lockup.wallet?.restricted) {
            Array.from(lockup.wallet.restricted).forEach(([key, value]) => {
                const until = parseInt(key);
                if (until <= Date.now() / 1000) {
                    balance = balance.add(new BN(value));
                }
            });
        }

        return balance;
    }, [lockup]);

    return (
        <TouchableHighlight
            onPress={() => {
                navigation.goBack();
                navigation.navigate('LockupWallet', { address: friendly });
            }}
            underlayColor={Theme.selector}
            style={[
                {
                    alignSelf: 'stretch', borderRadius: 14,
                    backgroundColor: Theme.item,
                    marginHorizontal: 16, marginTop: 8, marginBottom: 4
                },
            ]}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <TonSign width={16} height={16} color={'white'} />
                    </View>
                    <LockupMark
                        style={{
                            position: 'absolute', bottom: -1, right: -1
                        }}
                        height={16}
                        width={16}
                    />
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        marginRight: 10
                    }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                            {t('products.lockups.liquidBalance')}
                        </Text>
                        <Text style={{ color: Theme.textColor, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                            <ValueComponent value={liquid} />
                            {' TON'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                        <Text
                            style={{ color: '#8E979D', fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {friendly.slice(0, 6) + '...' + friendly.slice(friendly.length - 4)}
                            </Text>
                        </Text>
                        <PriceComponent
                            amount={liquid}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                marginTop: 2, height: 14
                            }}
                            textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                        />
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </TouchableHighlight>
    );
});