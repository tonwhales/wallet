import { BN } from 'bn.js';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendMode, WalletContractType } from 'ton';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { AppConfig } from '../../AppConfig';
import { getCurrentAddress } from '../../storage/appState';
import { ValueComponent } from '../../components/ValueComponent';
import { Theme } from '../../Theme';
import { WalletAddress } from '../../components/WalletAddress';
import { CloseButton } from '../../components/CloseButton';
import LottieView from 'lottie-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { StatusBar } from 'expo-status-bar';
import { systemFragment } from '../../systemFragment';
import { fragment } from '../../fragment';

function ellipsiseAddress(src: string) {
    return src.slice(0, 10)
        + '...'
        + src.slice(src.length - 6)
}

const MigrationProcessFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [status, setStatus] = React.useState<string>(t('migrate.inProgress'));
    const engine = useEngine();
    const acc = React.useMemo(() => getCurrentAddress(), []);

    React.useEffect(() => {
        let ended = false;

        backoff('migration', async () => {

            // Read key
            let key: WalletKeys
            try {
                key = await loadWalletKeys(acc.secretKeyEnc);
            } catch (e) {
                navigation.goBack();
                return;
            }
            let targetContract = await contractFromPublicKey(key.keyPair.publicKey);

            // Check possible addresses
            const legacyTypes: WalletContractType[] = [
                'org.ton.wallets.simple.r2',
                'org.ton.wallets.simple.r3',
                'org.ton.wallets.v2',
                'org.ton.wallets.v2.r2',
                'org.ton.wallets.v3',
                'org.ton.wallets.v3.r2'
            ];
            for (let type of legacyTypes) {
                if (ended) {
                    return;
                }
                let wallet = engine.connector.client.openWalletFromSecretKey({ workchain: 0, secretKey: key.keyPair.secretKey, type });
                if (ended) {
                    return;
                }
                setStatus(t('migrate.check', { address: ellipsiseAddress(wallet.address.toFriendly({ testOnly: AppConfig.isTestnet })) }));

                const state = await backoff('migration', () => engine.connector.client.getContractState(wallet.address));
                if (state.balance.gt(new BN(0))) {
                    setStatus(t('migrate.transfer', { address: ellipsiseAddress(wallet.address.toFriendly({ testOnly: AppConfig.isTestnet })) }));
                    wallet.prepare(0, key.keyPair.publicKey, type);

                    // Seqno
                    const seqno = await backoff('migration', () => wallet.getSeqNo());

                    // Transfer
                    await backoff('migration', () => wallet.transfer({
                        seqno,
                        to: targetContract.address,
                        value: new BN(0),
                        sendMode: SendMode.CARRRY_ALL_REMAINING_BALANCE,
                        secretKey: key.keyPair.secretKey,
                        bounce: false
                    }));

                    while (!ended) {
                        let s = await backoff('migration', () => wallet.getSeqNo());
                        if (s > seqno) {
                            break;
                        }
                    }
                }
            }

            navigation.goBack();
        });

        return () => {
            ended = true;
        }
    }, []);

    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ marginTop: safeArea.top }} />
            <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
                <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16, color: Theme.textColor, textAlign: 'center' }}>{status}</Text>
            </View>
        </>
    );
});

export const MigrationFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const [confirm, setConfirm] = React.useState(false);
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const animRef = React.useRef<LottieView>(null);

    React.useEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => animRef.current?.play(), 500);
        }
    }, []);

    const state = engine.products.legacy.useStateFull();
    let s = new BN(0);
    for (let w of state) {
        s = s.add(w.balance);
    }

    if (!confirm) {
        return (
            <>
                <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
                <AndroidToolbar style={{ marginTop: safeArea.top }} />
                {Platform.OS === 'ios' && (
                    <View style={{
                        paddingTop: 12,
                        paddingBottom: 17
                    }}>
                        <Text style={[{
                            fontWeight: '600',
                            marginLeft: 17,
                            fontSize: 17
                        }, { textAlign: 'center' }]}>{t('migrate.title')}</Text>
                    </View>
                )}
                <ScrollView
                    style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                    alwaysBounceVertical={false}
                >
                    <View style={{ flexGrow: 1 }} />

                    <View style={{ alignSelf: 'center' }}>
                        <LottieView
                            ref={animRef}
                            source={require('../../../assets/animations/zombie.json')}
                            autoPlay={true}
                            loop={true}
                            style={{ width: 140, height: 140 }}
                        />
                    </View>

                    <Text
                        style={{
                            marginHorizontal: 16,
                            fontSize: 30,
                            fontWeight: '700',
                            textAlign: 'center',
                            marginTop: 26,
                            marginBottom: 10,
                            color: Theme.textColor
                        }}
                    >
                        {t('migrate.title')}
                    </Text>
                    <Text
                        style={{
                            marginHorizontal: 16,
                            fontSize: 16,
                            textAlign: 'center',
                            marginBottom: 10,
                            color: Theme.textColor
                        }}
                    >
                        {t('migrate.subtitle')}
                    </Text>

                    <View style={{ flexGrow: 1 }} />
                    <View style={{
                        marginHorizontal: 16, backgroundColor: "white",
                        borderRadius: 14,
                    }}>

                        {state.map((v, i) => (
                            <>
                                {i > 0 && (<View style={{ height: 1, backgroundColor: Theme.divider }} />)}
                                <View key={v.address.toFriendly()}
                                    style={{
                                        flexDirection: 'row',
                                        alignSelf: 'flex-start',
                                        height: 40,
                                        alignItems: 'center',
                                        marginHorizontal: 8
                                    }}>
                                    <WalletAddress
                                        address={v.address}
                                        elipsise
                                        value={v.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                        style={{ flexGrow: 1, flexBasis: 0, alignItems: 'flex-start' }}
                                    />
                                    <ValueComponent
                                        style={{ color: Theme.textColor, fontSize: 14, fontWeight: '400' }}
                                        value={v.balance}
                                        suffix={' TON'}
                                    />
                                </View>
                            </>
                        ))}
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </ScrollView>
                <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                    <RoundButton title={t('common.start')} onPress={() => setConfirm(true)} disabled={s.lte(new BN(0))} display={s.lte(new BN(0)) ? 'secondary' : 'default'} />
                </View>
                {Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )}
            </>
        );
    }

    return (<MigrationProcessFragment />);
});