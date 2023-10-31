import * as React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendMode, internal, external, beginCell, storeMessage } from '@ton/core';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { WalletKeys } from '../../storage/walletKeys';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { ValueComponent } from '../../components/ValueComponent';
import { WalletAddress } from '../../components/WalletAddress';
import { CloseButton } from '../../components/CloseButton';
import LottieView from 'lottie-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { StatusBar } from 'expo-status-bar';
import { systemFragment } from '../../systemFragment';
import { fragment } from '../../fragment';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useTheme } from '../../engine/hooks/useTheme';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { useEffect, useState } from 'react';
import { useOldWalletsBalances } from '../../engine/hooks/useOldWalletsBalances';
import { useClient4 } from '../../engine/hooks/useClient4';
import { WalletContractV1R1, WalletContractV1R2, WalletContractV1R3, WalletContractV2R1, WalletContractV2R2, WalletContractV3R1, WalletContractV3R2 } from '@ton/ton';
import { getLastBlock } from '../../engine/accountWatcher';
import { fetchSeqno } from '../../engine/api/fetchSeqno';

function ellipsiseAddress(src: string) {
    return src.slice(0, 10)
        + '...'
        + src.slice(src.length - 6)
}

const MigrationProcessFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const client = useClient4(isTestnet);
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const [status, setStatus] = useState<string>(t('migrate.inProgress'));

    useEffect(() => {
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
            const legacyContracts = [
                WalletContractV1R1.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                WalletContractV1R2.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                WalletContractV1R3.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                WalletContractV2R1.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                WalletContractV2R2.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                WalletContractV3R1.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                WalletContractV3R2.create({ workchain: 0, publicKey: key.keyPair.publicKey }),
                // TODO: add v4, when next version will be implemented
            ];

            for (let contract of legacyContracts) {
                if (ended) {
                    return;
                }
                setStatus(t('migrate.check', { address: ellipsiseAddress(contract.address.toString({ testOnly: isTestnet })) }));

                const last = await getLastBlock();
                const state = await backoff('migration', () => client.getAccountLite(last, contract.address));
                if (BigInt(state.account.balance.coins) > BigInt(0)) {
                    setStatus(t(
                        'migrate.transfer',
                        { address: ellipsiseAddress(contract.address.toString({ testOnly: isTestnet })) }
                    ));

                    // Seqno
                    const seqno = await backoff('seqno', async () => fetchSeqno(client, await getLastBlock(), contract.address));

                    // Transfer

                    // Create transfer all & dstr transfer
                    let transfer = contract.createTransfer({
                        seqno: seqno,
                        secretKey: key.keyPair.secretKey,
                        sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE, // Transfer full balance
                        messages: [internal({
                            to: targetContract.address,
                            value: 0n,
                            bounce: false,
                        })]
                    });

                    // Create external message
                    let extMessage = external({
                        to: contract.address,
                        body: transfer,
                        init: seqno === 0 ? contract.init : undefined,
                    });

                    let msg = beginCell().store(storeMessage(extMessage)).endCell();

                    await backoff('migration', () => client.sendMessage(msg.toBoc({ idx: false })));
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
                <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16, color: theme.textColor, textAlign: 'center' }}>{status}</Text>
            </View>
        </>
    );
});

export const MigrationFragment = systemFragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const [confirm, setConfirm] = React.useState(false);
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => animRef.current?.play(), 500);
        }
    }, []);

    const state = useOldWalletsBalances();
    const s = state.total;

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
                            color: theme.textColor
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
                            color: theme.textColor
                        }}
                    >
                        {t('migrate.subtitle')}
                    </Text>

                    <View style={{ flexGrow: 1 }} />
                    <View style={{
                        marginHorizontal: 16, backgroundColor: theme.item,
                        borderRadius: 14,
                    }}>

                        {state.wallets.map((v, i) => {
                            if (!v) {
                                return null;
                            }
                            return (
                                <>
                                    {i > 0 && (<View style={{ height: 1, backgroundColor: theme.divider }} />)}
                                    <View key={v.address.toString()}
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
                                            value={v?.address.toString({ testOnly: isTestnet })}
                                            style={{ flexGrow: 1, flexBasis: 0, alignItems: 'flex-start' }}
                                        />
                                        <Text>
                                            <ValueComponent value={v.balace} /> TON
                                        </Text>
                                    </View>
                                </>
                            )
                        })}
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </ScrollView>
                <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                    <RoundButton
                        title={t('common.start')}
                        onPress={() => setConfirm(true)}
                        disabled={s <= BigInt(0)}
                        display={s <= BigInt(0) ? 'secondary' : 'default'}
                    />
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