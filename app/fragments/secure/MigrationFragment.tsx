import { BN } from 'bn.js';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, InternalMessage, SendMode, StateInit, WalletContractType } from 'ton';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { WalletKeys } from '../../storage/walletKeys';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { contractFromPublicKey, contractFromPublicKeyTyped } from '../../engine/contractFromPublicKey';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import { ValueComponent } from '../../components/ValueComponent';
import { WalletAddress } from '../../components/WalletAddress';
import { CloseButton } from '../../components/CloseButton';
import LottieView from 'lottie-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { StatusBar } from 'expo-status-bar';
import { systemFragment } from '../../systemFragment';
import { fragment } from '../../fragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { fetchSeqno } from '../../engine/api/fetchSeqno';

function ellipsiseAddress(src: string) {
    return src.slice(0, 10)
        + '...'
        + src.slice(src.length - 6)
}

const MigrationProcessFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const [status, setStatus] = React.useState<string>(t('migrate.inProgress'));
    const engine = useEngine();

    React.useEffect(() => {
        let ended = false;

        backoff('migration', async () => {

            // Read key
            let key: WalletKeys
            try {
                key = await authContext.authenticate({ cancelable: true });
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
                let wallet = contractFromPublicKeyTyped(key.keyPair.publicKey, type);
                if (ended) {
                    return;
                }
                setStatus(t('migrate.check', { address: ellipsiseAddress(wallet.address.toFriendly({ testOnly: AppConfig.isTestnet })) }));

                const block = await engine.client4.getLastBlock();
                const state = (await backoff('migration', () => engine.client4.getAccount(block.last.seqno, wallet.address))).account;
                if (new BN(state.balance.coins, 10).gt(new BN(0))) {
                    setStatus(t('migrate.transfer', { address: ellipsiseAddress(wallet.address.toFriendly({ testOnly: AppConfig.isTestnet })) }));

                    // Seqno
                    const seqno = await fetchSeqno(engine.client4, block.last.seqno, wallet.address);

                    let intMessage: InternalMessage;

                    intMessage = new InternalMessage({
                        to: targetContract.address,
                        value: new BN(0),
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: seqno === 0 ? new StateInit({ code: wallet.source.initialCode, data: wallet.source.initialData }) : null,
                            body: new CommentMessage('')
                        })
                    });

                    // Transfer
                    const transfer = wallet.createTransfer({
                        seqno,
                        order: intMessage,
                        sendMode: SendMode.CARRRY_ALL_REMAINING_BALANCE,
                        secretKey: key.keyPair.secretKey
                    });

                    // Create external message
                    let extMessage = new ExternalMessage({
                        to: wallet.address,
                        body: new CommonMessageInfo({
                            stateInit: seqno === 0 ? new StateInit({ code: wallet.source.initialCode, data: wallet.source.initialData }) : null,
                            body: new CellMessage(transfer)
                        })
                    });
                    let msg = new Cell();
                    extMessage.writeTo(msg);

                    await backoff('migration_transfer', () => engine.client4.sendMessage(msg.toBoc({ idx: false })));

                    while (!ended) {
                        let s = await backoff('migration_seqno', () => fetchSeqno(engine.client4, block.last.seqno, wallet.address));
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
    const { Theme, AppConfig } = useAppConfig();
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
                        marginHorizontal: 16, backgroundColor: Theme.item,
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
                                    <Text>
                                        <ValueComponent value={v.balance} /> TON
                                    </Text>
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