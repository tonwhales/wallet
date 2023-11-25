import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { Swipeable, TouchableHighlight } from "react-native-gesture-handler";
import { useHoldersAccountStatus, useSelectedAccount, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchCards";
import { getDomainKey } from "../../engine/state/domainKeys";
import { PerfText } from "../basic/PerfText";

import IcTonIcon from '@assets/ic-ton-acc.svg';

export const HoldersAccountItem = memo((props: {
    account: GeneralHoldersAccount,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean
}) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;

    const swipableRef = useRef<Swipeable>(null);

    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

    const onPress = useCallback(() => {
        const domain = extractDomain(holdersUrl);
        const domainKey = getDomainKey(domain);
        if (needsEnrolment || !domainKey) {
            navigation.navigate(
                'HoldersLanding',
                {
                    endpoint: holdersUrl,
                    onEnrollType: props.account ? { type: 'account', id: props.account.id } : { type: 'create' }
                }
            );
            return;
        }
        navigation.navigateHolders(props.account ? { type: 'account', id: props.account.id } : { type: 'create' });
    }, [props.account, needsEnrolment]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const title = props.account?.name
        ? props.account.name
        : t('products.holders.title');
    const subtitle = props.account
        ? `${t('products.holders.card.card')} ${props.account.cards.map((card, index) => card.lastFourDigits).join(', ')}`
        : t('products.holders.card.defaultSubtitle');

    const Wrapper = props.hidden ? View : TouchableHighlight;
    const wrapperProps = props.hidden ? {} : {
        onPressIn: onPressIn,
        onPressOut: onPressOut,
        onPress: onPress
    }

    return (
        (props.rightAction) ? (
            <Animated.View style={[
                {
                    flex: 1, flexDirection: 'row',
                    paddingHorizontal: 16,
                },
                animatedStyle
            ]}>
                <Swipeable
                    ref={swipableRef}
                    overshootRight={false}
                    containerStyle={{ flex: 1 }}
                    useNativeAnimations={true}
                    childrenContainerStyle={{
                        flex: 1,
                        borderTopLeftRadius: props.first ? 20 : 0,
                        borderTopRightRadius: props.first ? 20 : 0,
                        borderBottomLeftRadius: props.last ? 20 : 0,
                        borderBottomRightRadius: props.last ? 20 : 0,
                        overflow: 'hidden',
                    }}
                    renderRightActions={() => {
                        return (
                            <Pressable
                                style={{
                                    padding: 20,
                                    justifyContent: 'center', alignItems: 'center',
                                    borderTopRightRadius: props.first ? 20 : 0,
                                    borderBottomRightRadius: props.last ? 20 : 0,
                                    backgroundColor: props.single ? theme.transparent : theme.accent,
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
                                        backgroundColor: theme.surfaceOnBg,
                                    }}
                                />}
                            </Pressable>
                        )
                    }}
                >
                    <Wrapper
                        style={{ flex: 1 }}
                        {...wrapperProps}
                    >
                        <View style={{
                            flexGrow: 1, flexDirection: 'row',
                            padding: 20,
                            alignItems: 'center',
                            backgroundColor: theme.surfaceOnBg,
                        }}>
                            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                <IcTonIcon width={46} height={46} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <PerfText
                                    style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {title}
                                </PerfText>
                                <PerfText style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}>
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {subtitle}
                                    </PerfText>
                                </PerfText>
                            </View>
                            {(!!props.account && props.account.balance) && (
                                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                    <PerfText style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                                        <ValueComponent value={props.account.balance} precision={2} />
                                        <PerfText style={{ opacity: 0.5 }}>
                                            {' TON'}
                                        </PerfText>
                                    </PerfText>
                                    <PriceComponent
                                        amount={BigInt(props.account.balance)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            alignSelf: 'flex-end',
                                            height: undefined
                                        }}
                                        textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                        currencyCode={'EUR'}
                                    />
                                </View>
                            )}
                        </View>
                    </Wrapper>
                </Swipeable>
                {!props.last && (
                    <View style={{ backgroundColor: theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />
                )}
            </Animated.View>
        ) : (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, borderRadius: 20 }}
                onPress={onPress}
            >
                <Animated.View style={[{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', padding: 20 }, animatedStyle]}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                        <IcTonIcon width={46} height={46} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <PerfText
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {title}
                        </PerfText>
                        <PerfText style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}>
                            <PerfText style={{ flexShrink: 1 }}>
                                {subtitle}
                            </PerfText>
                        </PerfText>
                    </View>
                    {(!!props.account && props.account.balance) && (
                        <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                            <PerfText style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                                <ValueComponent value={props.account.balance} precision={2} centFontStyle={{ opacity: 0.5 }} />
                                <PerfText style={{ opacity: 0.5 }}>
                                    {' TON'}
                                </PerfText>
                            </PerfText>
                            <PriceComponent
                                amount={BigInt(props.account.balance)}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: undefined
                                }}
                                textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                currencyCode={'EUR'}
                            />
                        </View>
                    )}
                </Animated.View>
                {!props.last && (<View style={{ backgroundColor: theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />)}
            </Pressable>
        )
    );
});