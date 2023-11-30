import * as React from 'react';
import { KnownJettonMasters } from '../../secure/KnownWallets';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Pressable, Image, Text } from 'react-native';
import { ValueComponent } from '../ValueComponent';
import { WImage } from '../WImage';
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import Animated from 'react-native-reanimated';
import { memo, useCallback, useRef } from 'react';
import { Swipeable, TouchableHighlight } from 'react-native-gesture-handler';
import { useNetwork, useTheme } from '../../engine/hooks';
import { Jetton } from '../../engine/types';
import { PerfText } from '../basic/PerfText';

export const JettonProductItem = memo((props: {
    jetton: Jetton,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const balance = props.jetton.balance;
    const swipableRef = useRef<Swipeable>(null);

    const isKnown = !!KnownJettonMasters(isTestnet)[props.jetton.master.toString({ testOnly: isTestnet })];

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onPress = useCallback(() => {
        navigation.navigateSimpleTransfer({
            amount: null,
            target: null,
            comment: null,
            jetton: props.jetton.wallet,
            stateInit: null,
            job: null,
            callback: null
        });
    }, [props.jetton]);

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
                    paddingHorizontal: 16
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
                        overflow: 'hidden'
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
                            flexDirection: 'row', flexGrow: 1,
                            alignItems: 'center',
                            padding: 20,
                            backgroundColor: theme.surfaceOnBg,
                        }}>
                            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                <WImage
                                    src={props.jetton.icon ? props.jetton.icon : undefined}
                                    width={46}
                                    heigh={46}
                                    borderRadius={23}
                                />
                                {isKnown && (
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
                                )}
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <PerfText
                                    style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {props.jetton.name}
                                </PerfText>
                                <PerfText
                                    numberOfLines={1} ellipsizeMode={'tail'}
                                    style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {props.jetton.description}
                                    </PerfText>
                                </PerfText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <PerfText style={{
                                    color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600',
                                }}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={props.jetton.decimals}
                                    />
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                                    </Text>
                                </PerfText>
                                <View style={{ flexGrow: 1 }} />
                            </View>
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
                style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
                onPress={onPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceOnBg
                    },
                    animatedStyle
                ]}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                        <WImage
                            src={props.jetton.icon ? props.jetton.icon : undefined}
                            width={46}
                            heigh={46}
                            borderRadius={23}
                        />
                        {isKnown && (
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
                        )}
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <PerfText
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {props.jetton.name}
                        </PerfText>
                        <PerfText
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                        >
                            <PerfText style={{ flexShrink: 1 }}>
                                {props.jetton.description}
                            </PerfText>
                        </PerfText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <PerfText style={{
                            color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600',
                        }}>
                            <ValueComponent
                                value={balance}
                                decimals={props.jetton.decimals}
                            />
                            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                {props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                            </Text>
                        </PerfText>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                </Animated.View>
                {!props.last && (<View style={{ backgroundColor: theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />)}
            </Pressable>
        )
    );
});