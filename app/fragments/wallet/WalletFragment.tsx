import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Cell, fromNano, parseTransaction, RawTransaction } from 'ton';
import { client } from '../../client';
import { fragment } from "../../fragment";
import { getAppState } from '../../utils/storage';
import { backoff } from '../../utils/time';
import { RoundButton } from '../../components/RoundButton';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { ScrollView } from 'react-native-gesture-handler';
import { TransactionView } from '../../components/TransactionView';
import { useAccountSync } from '../../sync/useAccountSync';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Modalize } from 'react-native-modalize';
import { WalletReceiveComponent } from './WalletReceiveComponent';
import { Portal } from 'react-native-portalize';
import { ValueComponent } from '../../components/ValueComponent';

export const WalletFragment = fragment(() => {
    const receiveRef = React.useRef<Modalize>(null);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getAppState()!.address, []);
    const [balance, loading] = useAccountSync(address);
    const [transactions, setTransactions] = React.useState<RawTransaction[] | null>(null);
    React.useEffect(() => {
        (async () => {
            backoff(async () => {
                while (true) {
                    let transactions = await client.getTransactions(address, { limit: 100 });
                    let res = transactions.map((v) => parseTransaction(address.workChain, Cell.fromBoc(Buffer.from(v.data, 'base64'))[0].beginParse()));
                    setTransactions(res);
                }
            })
        })();
    }, []);
    if (!balance) {
        return (
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Theme.loader} />
            </View>
        )
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView style={{ flexGrow: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom + 52 }}>
                <View style={{ alignSelf: 'stretch', backgroundColor: 'black', paddingTop: safeArea.top + 1000, marginTop: -1000, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
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
                </View>
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
            </ScrollView>
            <Portal>
                <Modalize ref={receiveRef} adjustToContentHeight={true}>
                    <WalletReceiveComponent />
                </Modalize>
            </Portal>
        </View>
    );
});