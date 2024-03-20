import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useAppConnections, useConnectApp, useHoldersAccountStatus, useSelectedAccount, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { GeneralHoldersAccount, GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ScrollView, Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { HoldersAccountCard } from "./HoldersAccountCard";
import { Platform } from "react-native";
import { extensionKey } from "../../engine/hooks/dapps/useAddExtension";
import { TonConnectBridgeType } from "../../engine/tonconnect/types";

import IcTonIcon from '@assets/ic-ton-acc.svg';

export const HoldersAccountItem = memo((props: {
    account: GeneralHoldersAccount,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean,
    style?: StyleProp<ViewStyle>
}) => {
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;

    const connectApp = useConnectApp();
    const connectAppConnections = useAppConnections();

    const needsEnrollment = useMemo(() => {
        try {
            const app = connectApp(holdersUrl);

            if (!app) {
                return true;
            }
 
            const connections = connectAppConnections(extensionKey(app.url));

            if (!connections.find((item) => item.type === TonConnectBridgeType.Injected)) {
                return true;
            }

            if (!holdersAccStatus) {
                return true;
            }
            if (holdersAccStatus.state === HoldersAccountState.NeedEnrollment) {
                return true;
            }
        } catch (error) {
            return true;
        }

        return false;
    }, [holdersAccStatus, connectApp, connectAppConnections]);

    const isPro = useMemo(() => {
        return props.account.cards.find((card) => card.personalizationCode === 'black-pro') !== undefined;
    }, [props.account.cards]);

    const onPress = useCallback(() => {
        if (needsEnrollment) {
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
    }, [props.account, needsEnrollment]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const title = props.account?.name
        ? props.account.name
        : t('products.holders.accounts.account');
    const subtitle = isPro ? t('products.holders.accounts.proAccount') : t('products.holders.accounts.basicAccount');

    return (
        <Swipeable
            ref={swipableRef}
            containerStyle={[{ flex: 1 }, props.style]}
            useNativeAnimations={true}
            renderRightActions={() => {
                return (
                    <Pressable
                        style={[
                            {
                                padding: 20,
                                justifyContent: 'center', alignItems: 'center',
                                borderRadius: 20,
                                backgroundColor: theme.accent,
                                marginLeft: 10
                            }
                        ]}
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
            <Animated.View style={animatedStyle}>
                <TouchableOpacity
                    style={{ borderRadius: 20, overflow: 'hidden' }}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <View style={{ flexGrow: 1, paddingTop: 20, backgroundColor: theme.surfaceOnBg }}>
                        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 }}>
                            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                <IcTonIcon width={46} height={46} />
                            </View>
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                <PerfText
                                    style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {title}
                                </PerfText>
                                <PerfText
                                    style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {subtitle}
                                    </PerfText>
                                </PerfText>
                            </View>
                            {(!!props.account && props.account.balance) && (
                                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                    <PerfText style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                        <ValueComponent value={props.account.balance} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                                        <PerfText style={{ color: theme.textSecondary }}>
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
                                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                        currencyCode={'EUR'}
                                        theme={theme}
                                    />
                                </View>
                            )}
                        </View>
                        <ScrollView
                            horizontal={true}
                            style={[{ height: 46, marginTop: 10 }, Platform.select({ android: { marginLeft: 78 } })]}
                            contentContainerStyle={{ gap: 8 }}
                            contentInset={Platform.select({ ios: { left: 78 } })}
                            contentOffset={Platform.select({ ios: { x: -78, y: 0 } })}
                            showsHorizontalScrollIndicator={false}
                            alwaysBounceHorizontal={props.account.cards.length > 0}
                        >
                            {props.account.cards.map((card) => {
                                return (
                                    <HoldersAccountCard
                                        card={card as GeneralHoldersCard}
                                        theme={theme}
                                    />
                                )
                            })}
                            {props.account.cards.length === 0 && (
                                <PerfText style={[{ color: theme.textSecondary }, Typography.medium17_24]}>
                                    {t('products.holders.accounts.noCards')}
                                </PerfText>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Swipeable >
    );
});