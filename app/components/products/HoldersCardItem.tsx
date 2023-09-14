import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { HoldersCard, holdersUrl } from "../../engine/holders/HoldersProduct";
import { View, Text, Image, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { holdersCardImageMap } from "./HoldersProductComponent";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { useEngine } from "../../engine/Engine";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { Swipeable } from "react-native-gesture-handler";

import MCard from '../../../assets/ic-m-card.svg';

export const HoldersCardItem = memo((props: {
    account?: HoldersCard,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean
}) => {
    const { Theme } = useAppConfig();
    const image = holdersCardImageMap[props.account?.card.personalizationCode || 'classic'] || holdersCardImageMap['classic'];
    const [swiping, setSwiping] = useState(false);

    const swipableRef = useRef<Swipeable>(null);

    const engine = useEngine();
    const navigation = useTypedNavigation();
    const status = engine.products.holders.useStatus();

    const needsEnrolment = useMemo(() => {
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.products.keys.getDomainKey(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    const onPress = useCallback(() => {
        if (swiping) {
            return;
        }
        if (needsEnrolment) {
            navigation.navigate(
                'HoldersLanding',
                {
                    endpoint: holdersUrl,
                    onEnrollType: props.account ? { type: 'card', id: props.account.id } : { type: 'account' }
                }
            );
            return;
        }
        navigation.navigateHolders(props.account ? { type: 'card', id: props.account.id } : { type: 'account' });
    }, [props.account, needsEnrolment, swiping]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onSwipe = useCallback((inProgress: boolean) => {
        setSwiping(inProgress);
        onPressOut();
    }, []);

    return (
        (props.rightAction) ? (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1 }}
                onPress={onPress}
            >
                <Animated.View style={[
                    {
                        flex: 1,
                        flexDirection: 'row',
                    },
                    swiping ? { transform: [{ scale: 1 }] } : animatedStyle
                ]}>
                    <Swipeable
                        ref={swipableRef}
                        onSwipeableWillOpen={() => onSwipe(true)}
                        onSwipeableOpen={() => onSwipe(true)}
                        onSwipeableWillClose={() => onSwipe(false)}
                        onSwipeableClose={() => onSwipe(false)}
                        overshootRight={false}
                        containerStyle={{ flex: 1 }}
                        useNativeAnimations={true}
                        childrenContainerStyle={{
                            marginHorizontal: 16,
                            borderTopLeftRadius: props.first ? 20 : 0,
                            borderTopRightRadius: props.first ? 20 : 0,
                            borderBottomLeftRadius: props.last ? 20 : 0,
                            borderBottomRightRadius: props.last ? 20 : 0,
                            overflow: 'hidden'
                        }}
                        renderRightActions={() => {
                            return (
                                <Pressable
                                    style={{
                                        right: -16,
                                        padding: 20,
                                        justifyContent: 'center', alignItems: 'center',
                                        borderTopRightRadius: props.first ? 20 : 0,
                                        borderBottomRightRadius: props.last ? 20 : 0,
                                        backgroundColor: props.single ? Theme.transparent : Theme.surfaceSecondary,
                                    }}
                                    onPress={() => {
                                        swipableRef.current?.close();
                                        if (props.rightAction) {
                                            props.rightAction();
                                        }
                                    }}
                                >
                                    {props.rightActionIcon}
                                    {!props.single && <View
                                        style={{
                                            position: 'absolute',
                                            top: 0, bottom: 0, left: -20,
                                            width: 20,
                                            backgroundColor: Theme.surfaceSecondary,
                                        }}
                                    />}
                                </Pressable>
                            )
                        }}
                    >
                        <View style={{
                            flexGrow: 1, flexDirection: 'row',
                            padding: 20,
                            alignItems: 'center',
                            backgroundColor: Theme.surfaceSecondary,
                        }}>
                            <View style={{ width: 46, height: 30, borderRadius: 6, borderWidth: 0, overflow: 'hidden' }}>
                                <Image source={image} style={{ width: 46, height: 30, borderRadius: 6 }} />
                                {!!props.account?.card.lastFourDigits && (
                                    <Text style={{ color: Theme.white, fontSize: 7.5, position: 'absolute', bottom: 4.5, left: 5 }} numberOfLines={1}>
                                        {props.account.card.lastFourDigits}
                                    </Text>
                                )}
                                {!props.account && (
                                    <Image source={require('../../../assets/ic_eu.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                                )}
                                {(props.account && props.account.type === 'virtual') && (
                                    <MCard height={8} width={13} style={{ height: 8, width: 13, position: 'absolute', bottom: 5.25, right: 5.5 }} />
                                )}
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text
                                    style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {(
                                        props.account?.card.lastFourDigits
                                            ? t('products.zenPay.card.title', { cardNumber: props.account.card.lastFourDigits })
                                            : t('products.zenPay.card.defaultTitle')
                                    )}
                                </Text>
                                <Text style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.textSecondary }}>
                                    {!!props.account && (
                                        <Text style={{ flexShrink: 1 }}>
                                            {t(`products.zenPay.card.type.${props.account.type}`) + `${props.account?.card.personalizationCode === 'minimal-2' ? ' PRO' : ''}`}
                                        </Text>
                                    )}
                                    {!props.account && (
                                        <Text style={{ flexShrink: 1 }}>
                                            {t('products.zenPay.card.defaultSubtitle')}
                                        </Text>
                                    )}
                                </Text>
                            </View>
                            {(!!props.account && props.account.balance) && (
                                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                    <Text style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                                        <ValueComponent value={props.account.balance} precision={2} />{' TON'}
                                    </Text>
                                    <PriceComponent
                                        amount={props.account.balance}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            alignSelf: 'flex-end',
                                            height: undefined
                                        }}
                                        textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                        currencyCode={'EUR'}
                                    />
                                </View>
                            )}
                        </View>
                    </Swipeable>
                </Animated.View>
                {!props.last && (
                    <View style={{ backgroundColor: Theme.style === 'dark' ? Theme.surfacePimary : Theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />
                )}
            </Pressable>
        ) : (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, borderRadius: 20 }}
                onPress={onPress}
            >
                <Animated.View style={[{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', padding: 20 }, animatedStyle]}>
                    <View style={{ width: 46, height: 30, borderRadius: 6, borderWidth: 0, overflow: 'hidden' }}>
                        <Image source={image} style={{ width: 46, height: 30, borderRadius: 6 }} />
                        {!!props.account?.card.lastFourDigits && (
                            <Text style={{ color: 'white', fontSize: 7.5, position: 'absolute', bottom: 4.5, left: 5 }} numberOfLines={1}>
                                {props.account.card.lastFourDigits}
                            </Text>
                        )}
                        {!props.account && (
                            <Image source={require('../../../assets/ic_eu.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                        )}
                        {(props.account && props.account.type === 'virtual') && (
                            <MCard height={8} width={13} style={{ height: 8, width: 13, position: 'absolute', bottom: 5.25, right: 5.5 }} />
                        )}
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text
                            style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {(
                                props.account?.card.lastFourDigits
                                    ? t('products.zenPay.card.title', { cardNumber: props.account.card.lastFourDigits })
                                    : t('products.zenPay.card.defaultTitle')
                            )}
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.textSecondary }}>
                            {!!props.account && (
                                <Text style={{ flexShrink: 1 }}>
                                    {t(`products.zenPay.card.type.${props.account.type}`) + `${props.account?.card.personalizationCode === 'minimal-2' ? ' PRO' : ''}`}
                                </Text>
                            )}
                            {!props.account && (
                                <Text style={{ flexShrink: 1 }}>
                                    {t('products.zenPay.card.defaultSubtitle')}
                                </Text>
                            )}
                        </Text>
                    </View>
                    {(!!props.account && props.account.balance) && (
                        <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                            <Text style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                                <ValueComponent value={props.account.balance} precision={2} />{' TON'}
                            </Text>
                            <PriceComponent
                                amount={props.account.balance}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: undefined
                                }}
                                textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                currencyCode={'EUR'}
                            />
                        </View>
                    )}
                </Animated.View>
                {!props.last && (<View style={{ backgroundColor: Theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />)}
            </Pressable>
        )
    );
});