import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Cell, parseTransaction, RawTransaction } from 'ton';
import { client } from '../../client';
import { fragment } from "../../fragment";
import { getAppState } from '../../utils/storage';
import { backoff } from '../../utils/time';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { TransactionView } from '../../components/TransactionView';
import { useAccountSync } from '../../sync/useAccountSync';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Modalize } from 'react-native-modalize';
import { WalletReceiveComponent } from './WalletReceiveComponent';
import { Portal } from 'react-native-portalize';
import { ValueComponent } from '../../components/ValueComponent';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

export const WalletFragment = fragment(() => {
    const receiveRef = React.useRef<Modalize>(null);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const [balance, loading] = useAccountSync(address);
    const [transactions, setTransactions] = React.useState<RawTransaction[] | null>(null);
    React.useEffect(() => {
        let end = false;
        (async () => {
            backoff(async () => {
                while (!end) {
                    let transactions = await client.getTransactions(address, { limit: 100 });
                    let res = transactions.map((v) => parseTransaction(address.workChain, Cell.fromBoc(Buffer.from(v.data, 'base64'))[0].beginParse()));
                    setTransactions(res);
                }
            })
        })();
        return () => { end = true; }
    }, []);

    //
    // Animations
    //
    const scrollOffset = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollOffset.value = event.contentOffset.y;
        },
    });
    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: -Math.min(scrollOffset.value, 340 - safeArea.top - 44) }]
        }
    }, []);
    const buttonsContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: (160 - Math.min(Math.max(scrollOffset.value, 0), 160)) / 160
        }
    }, []);
    const balanceTransform = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: Math.max(0, -Math.min(scrollOffset.value, 300 - safeArea.top - 44) / 2 + 100) }]
        }
    }, []);
    const balanceFont = useAnimatedStyle(() => {
        const progress = Math.min(Math.max(0, -Math.min(scrollOffset.value, 300 - safeArea.top - 44) / 2 + 100), 100) / 100;
        return {
            fontSize: 45 * progress + (1 - progress) * 20
        }
    }, []);

    //
    // Loading
    //

    if (!balance) {
        return (
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Theme.loader} />
            </View>
        )
    }

    //
    // Content
    //

    return (
        <View style={{ flexGrow: 1 }}>
            <Animated.ScrollView
                onScroll={scrollHandler}
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom + 52 }}
                scrollEventThrottle={1}
            >
                <View style={{ height: 300 + safeArea.top }} />
                {/* <View style={{ alignSelf: 'stretch', backgroundColor: 'black', paddingTop: safeArea.top + 1000, marginTop: -1000, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
                    <Text style={{ marginTop: 12, marginBottom: 24, color: 'white', opacity: 0.6, height: 44 }}>
                        {loading ? 'Updating...' : 'Up to date'}
                    </Text>
                    <Text style={{ fontSize: 45, marginTop: 48, fontWeight: '600', color: 'white' }}>
                        💎 <ValueComponent value={balance} centFontSize={23} />
                    </Text>
                    <Text style={{ color: 'white', opacity: 0.6, marginTop: 2 }}>Your balance</Text>
                    <View style={{ flexDirection: 'row', marginTop: 72, marginHorizontal: 8 }}>
                        <RoundButton title="Send" style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 8 }} onPress={() => navigation.navigate('Transfer')} />
                        <RoundButton title="Receive" style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 8 }} onPress={() => receiveRef.current!.open()} />
                    </View>
                </View> */}
                <View style={{ backgroundColor: 'black' }} >
                    <View style={{ flexDirection: 'column', height: 20, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: 'white' }} />
                </View>
                {!transactions && (
                    <View style={{ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                        <ActivityIndicator />
                    </View>
                )}
                {transactions && transactions.length === 0 && (
                    <View style={{ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                        <LottieView
                            source={require('../../../assets/animations/chicken.json')}
                            autoPlay={true}
                            loop={false}
                            progress={0.2}
                            style={{ width: 200, height: 200, marginBottom: 16 }}
                        />
                        {/* <Text style={{ fontSize: 18, marginBottom: 16 }}>Wallet Created</Text> */}
                        <RoundButton title="Receive TONCOIN" size="normal" display="outline" onPress={() => receiveRef.current!.open()} />
                    </View>
                )}
                {transactions && transactions.length > 0 && transactions.map((t, i) => (
                    <TransactionView tx={t} key={'tx-' + i} />
                ))}
            </Animated.ScrollView>

            {/* Basic */}

            <Animated.View style={[
                { alignSelf: 'stretch', backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', paddingTop: 1000 + safeArea.top, marginTop: -1000, paddingBottom: 16, position: 'absolute', top: 0, left: 0, right: 0, height: 300 + 1000 + safeArea.top },
                containerStyle
            ]}>
                <View style={{ flexGrow: 1 }} />

                <Animated.View style={[{ flexDirection: 'row', marginTop: 72, marginHorizontal: 8 }, buttonsContainerStyle]}>
                    <RoundButton title="Send" style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 8 }} onPress={() => navigation.navigate('Transfer')} />
                    <RoundButton title="Receive" style={{ flexGrow: 1, flexBasis: 0, marginHorizontal: 8 }} onPress={() => receiveRef.current!.open()} />
                </Animated.View>
            </Animated.View>

            {/* Sync state */}
            <Animated.View style={[{ position: 'absolute', top: safeArea.top, left: 0, right: 0, marginBottom: 24, height: 44, alignItems: 'center', justifyContent: 'center' }, buttonsContainerStyle]}>
                <Text style={{ color: 'white', opacity: 0.6 }}>
                    {loading ? 'Updating...' : 'Up to date'}
                </Text>
            </Animated.View>

            {/* Balance */}
            <Animated.View style={[{ position: 'absolute', alignItems: 'center', paddingTop: safeArea.top, left: 0, right: 0, top: 0 }, balanceTransform]}>
                <Animated.Text style={[{ fontSize: 45, fontWeight: '500', color: 'white' }, balanceFont]}>
                    💎 <ValueComponent value={balance} centFontSize={20} />
                </Animated.Text>
                <Text style={{ color: 'white', opacity: 0.6, marginTop: 2 }}>Your balance</Text>
            </Animated.View>
            <Portal>
                <Modalize ref={receiveRef} adjustToContentHeight={true}>
                    <WalletReceiveComponent />
                </Modalize>
            </Portal>
        </View>
    );
});