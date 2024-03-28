import React, { useCallback, useMemo } from "react"
import { Pressable, Text, View, Image } from "react-native"
import { t } from "../../i18n/t";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import IcTonIcon from '@assets/ic-ton-acc.svg';
import { ValueComponent } from '../ValueComponent';
import { PriceComponent } from '../PriceComponent';
import { AccountLite } from '../../engine/hooks/accounts/useAccountLite';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import Animated from 'react-native-reanimated';
import { StakingProductComponent } from "./StakingProductComponent";

export const LedgerProductsComponent = React.memo(({ account }: { account: AccountLite }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onTonPress = useCallback(() => {
        navigation.navigate('LedgerSimpleTransfer', {
            amount: null,
            target: null,
            comment: null,
            jetton: null,
            stateInit: null,
            job: null,
            callback: null
        });
    }, []);

    const tonItem = useMemo(() => {
        return (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, paddingHorizontal: 0, marginBottom: 16 }}
                onPress={onTonPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 20,
                        overflow: 'hidden'
                    },
                    animatedStyle
                ]}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                        <IcTonIcon width={46} height={46} />
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: 20, width: 20, borderRadius: 10,
                            position: 'absolute', right: -2, bottom: -2,
                            backgroundColor: theme.surfaceOnBg
                        }}>
                            <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ height: 20, width: 20 }}
                            />
                        </View>
                    </View>
                    <View style={{ marginLeft: 12, flexShrink: 1 }}>
                        <Text
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {'TON'}
                        </Text>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                        >
                            {'The Open Network'}
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            <ValueComponent value={account?.balance ?? 0n} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>{' TON'}</Text>
                        </Text>
                        <PriceComponent
                            amount={account?.balance ?? 0n}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined,
                            }}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                            theme={theme}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        )
    }, [theme, account?.balance, onPressIn, onPressOut, animatedStyle, onTonPress]);

    return (
        <View style={{
            backgroundColor: theme.backgroundPrimary,
        }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                marginTop: 16,
                paddingVertical: 12,
                paddingHorizontal: 16
            }}>
                <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                    {t('common.products')}
                </Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                {tonItem}
            </View>

            <View style={{ marginTop: 4 }}>
                <StakingProductComponent isLedger key={'pool'} />
            </View>

            <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
                <LedgerJettonsProductComponent key={'jettons'} />
            </View>
        </View>
    );
});