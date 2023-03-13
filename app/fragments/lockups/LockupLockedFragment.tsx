import { View, Text, Platform } from "react-native";
import { fragment } from "../../fragment";
import LottieView from 'lottie-react-native';
import { useLayoutEffect, useMemo, useRef } from "react";
import { t } from "../../i18n/t";
import { ItemGroup } from "../../components/ItemGroup";
import { Theme } from "../../Theme";
import { useParams } from "../../utils/useParams";
import { ItemDivider } from "../../components/ItemDivider";
import { ItemButton } from "../../components/ItemButton";
import Chevron from '../../../assets/ic_ios_chevron_right.svg';
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { openWithInApp } from "../../utils/openWithInApp";
import { AppConfig } from "../../AppConfig";
import { CloseButton } from "../../components/CloseButton";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import BN from "bn.js";
import { ResctrictedButton } from "../../components/Lockup/ResctrictedButton";

export const LockupLockedFragment = fragment(() => {
    const { address } = useParams<{ address: string }>();
    const engine = useEngine();
    const anim = useRef<LottieView>(null);
    const navigation = useTypedNavigation();
    const target = Address.parse(address);
    const walletState = engine.products.lockup.useLockupWallet(target);

    const views = useMemo(() => {
        const views: any[] = [];
        if (walletState?.wallet?.locked) {
            Array.from(walletState.wallet.locked).forEach(([key, value], index) => {
                const until = parseInt(key);
                views.push(
                    <ResctrictedButton
                        key={`restricted-${index}`}
                        until={until}
                        value={value}
                        withDate
                    />
                );
            });
        }

        if (views.length === 0) {
            views.push(
                <ResctrictedButton
                    key={`restricted-null}`}
                    until={0}
                    value={new BN(0)}
                // withDate
                />
            );
        }

        return views
    }, [walletState]);

    useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play();
        }, 300);
    }, []);

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                paddingHorizontal: 16
            }}>
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 48
                }}>
                    <Text style={{
                        fontWeight: '700',
                        fontSize: 24,
                        textAlign: 'center'
                    }}>
                        {t('products.lockups.lockedBalance')}
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        textAlign: 'center',
                        marginTop: 10
                    }}>
                        {t('products.lockups.lockedBalanceDescription')}
                    </Text>
                </View>
            </View>
            <View style={{ width: '100%', marginTop: 30 }}>
                {views}
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
})