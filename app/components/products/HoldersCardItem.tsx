import React, { useCallback, useMemo, useRef, useState } from "react";
import { HoldersCard, holdersUrl } from "../../engine/holders/HoldersProduct";
import { View, Text, Image, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { holdersCardImageMap } from "./HoldersProductButton";
import { useAppConfig } from "../../utils/AppConfigContext";
import MCard from '../../../assets/ic-m-card.svg';
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { useEngine } from "../../engine/Engine";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { Swipeable } from "react-native-gesture-handler";

export const HoldersCardItem = React.memo((props: {
    account?: HoldersCard,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any
}) => {
    const { Theme } = useAppConfig();
    const image = holdersCardImageMap[props.account?.card.personalizationCode || 'classic'] || holdersCardImageMap['classic'];
    const [swiping, setSwiping] = useState(false);
    const [swipeOpened, setSwipeOpened] = useState(false);

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

    const onPress = useCallback(
        () => {
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
        },
        [props.account, needsEnrolment],
    );

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    return (
        (props.rightAction) ? (
            <Pressable
                onPressIn={swiping ? undefined : onPressIn}
                onPressOut={swiping ? undefined : onPressOut}
                style={{ flex: 1 }}
                onPress={swiping ? undefined : onPress}
            >
                <Swipeable
                    ref={swipableRef}
                    onSwipeableWillOpen={() => setSwiping(true)}
                    onSwipeableOpen={() => setSwipeOpened(true)}
                    onSwipeableClose={() => setSwipeOpened(false)}
                    containerStyle={{
                        flex: 1
                    }}
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
                                    marginRight: 16,
                                    padding: 20,
                                    justifyContent: 'center', alignItems: 'center',
                                    borderTopLeftRadius: props.first ? 20 : 0,
                                    borderTopRightRadius: props.first ? 20 : 0,
                                    borderBottomLeftRadius: props.last ? 20 : 0,
                                    borderBottomRightRadius: props.last ? 20 : 0,
                                    backgroundColor: Theme.lightGrey,
                                    overflow: 'hidden'
                                }}
                                onPress={() => {
                                    swipableRef.current?.close();
                                    if (props.rightAction) {
                                        props.rightAction();
                                    }
                                }}
                            >
                                {props.rightActionIcon}
                            </Pressable>
                        )
                    }}
                >
                    <Animated.View style={[
                        {
                            flexGrow: 1, flexDirection: 'row',
                            padding: 20,
                            alignItems: 'center',
                            backgroundColor: Theme.lightGrey,
                        },
                        animatedStyle
                    ]}>
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
                                style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {(
                                    props.account?.card.lastFourDigits
                                        ? t('products.zenPay.card.title', { cardNumber: props.account.card.lastFourDigits })
                                        : t('products.zenPay.card.defaultTitle')
                                )}
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.darkGrey }}>
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
                                <Text style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
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
                                    textStyle={{ color: Theme.darkGrey, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                    currencyCode={'EUR'}
                                />
                            </View>
                        )}
                    </Animated.View>
                </Swipeable>
                {!props.last && (
                    <View style={{ backgroundColor: Theme.lightGrey, marginHorizontal: 16, paddingHorizontal: 20 }}>
                        <View style={{ backgroundColor: Theme.mediumGrey, height: 1 }} />
                    </View>
                )}
            </Pressable>
        ) : (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, marginHorizontal: 20, borderRadius: 20 }}
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
                            style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {(
                                props.account?.card.lastFourDigits
                                    ? t('products.zenPay.card.title', { cardNumber: props.account.card.lastFourDigits })
                                    : t('products.zenPay.card.defaultTitle')
                            )}
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.darkGrey }}>
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
                            <Text style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
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
                                textStyle={{ color: Theme.darkGrey, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                currencyCode={'EUR'}
                            />
                        </View>
                    )}
                </Animated.View>
                {!props.last && (<View style={{ backgroundColor: Theme.mediumGrey, height: 1, marginHorizontal: 20 }} />)}
            </Pressable>
        )
    );
});