import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { Platform, StyleProp, Text, TextStyle, View } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { t, tStyled } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { backoff } from '../../utils/time';
import axios from 'axios';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { addConnectionReference, addPendingGrant, getAppInstanceKeyPair, getCurrentAddress, removePendingGrant } from '../../storage/appState';
import { contractFromPublicKey } from '../../sync/contractFromPublicKey';
import { AppConfig } from '../../AppConfig';
import { Cell, safeSign } from 'ton';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { sign } from 'ton-crypto';
import { Theme } from '../../Theme';
import { fragment } from '../../fragment';
import { warn } from '../../utils/log';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

const SignStateLoader = React.memo((props: { session: string, endpoint: string }) => {
    const navigation = useTypedNavigation();
    const [state, setState] = React.useState<{ type: 'loading' } | { type: 'expired' } | { type: 'initing', name: string, url: string } | { type: 'completed' }>({ type: 'loading' });
    React.useEffect(() => {
        let ended = false;
        backoff('authenticate', async () => {
            if (ended) {
                return;
            }
            let currentState = await axios.get('https://' + props.endpoint + '/connect/' + props.session);
            if (ended) {
                return;
            }
            if (currentState.data.state === 'not_found') {
                setState({ type: 'expired' });
                return;
            }
            if (currentState.data.state === 'initing') {
                setState({ type: 'initing', name: currentState.data.name, url: currentState.data.url });
                return;
            }
            if (currentState.data.state === 'ready') {
                setState({ type: 'completed' });
                return;
            }
            setState({ type: 'expired' });
        });
        return () => {
            ended = true;
        };
    }, []);

    // Approve
    const acc = React.useMemo(() => getCurrentAddress(), []);
    let active = React.useRef(true);
    React.useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = React.useCallback(async () => {

        if (state.type !== 'initing') {
            return;
        }

        // Load data
        const contract = await contractFromPublicKey(acc.publicKey);
        let walletConfig = contract.source.backup();
        let walletType = contract.source.type;
        let address = contract.address.toFriendly({ testOnly: AppConfig.isTestnet });
        let appInstanceKeyPair = await getAppInstanceKeyPair();
        let endpoint = 'https://connect.tonhubapi.com/connect/command';
        let name = state.name;
        let url = state.url;

        // Sign
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            warn(e);
            return;
        }
        let toSign = new Cell();
        toSign.bits.writeCoins(0);
        toSign.bits.writeBuffer(Buffer.from(props.session, 'base64'));
        toSign.bits.writeAddress(contract.address);
        toSign.bits.writeBit(1);
        let ref = new Cell();
        ref.bits.writeBuffer(Buffer.from(endpoint));
        toSign.refs.push(ref);
        let ref2 = new Cell();
        ref2.bits.writeBuffer(appInstanceKeyPair.publicKey);
        toSign.refs.push(ref2);
        let signature = safeSign(toSign, walletKeys.keyPair.secretKey);

        // Notify
        await backoff('authenticate', async () => {
            if (!active.current) {
                return;
            }

            // Apply answer
            await axios.post('https://' + props.endpoint + '/connect/answer', {
                key: props.session,
                appPublicKey: appInstanceKeyPair.publicKey.toString('base64'),
                address: address,
                walletType,
                walletConfig,
                walletSig: signature.toString('base64'),
                endpoint
            }, { timeout: 5000 });

            // Persist reference
            addConnectionReference(props.session, name, url, Date.now());
            addPendingGrant(props.session);

            // Grant access
            await backoff('authenticate', async () => {
                await axios.post('https://connect.tonhubapi.com/connect/grant', { key: props.session }, { timeout: 5000 });
                removePendingGrant(props.session);
            });

            // Exit if already exited screen
            if (!active.current) {
                return;
            }

            navigation.goBack();
        });
    }, [state]);

    // When loading
    if (state.type === 'loading') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <LoadingIndicator simple={true} />
            </View>
        )
    }

    // Expired
    if (state.type === 'expired') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.expired')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
            </View>
        );
    }

    // Completed
    if (state.type === 'completed') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.completed')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{tStyled('auth.message', { name: state.name })}</Text>
            <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: Theme.textSecondary, marginBottom: 32 }}>{state.url}</Text>
            <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: Theme.textSecondary, marginBottom: 32 }}>{t('auth.hint')}</Text>
            <RoundButton title={t('auth.action')} action={approve} size="large" style={{ width: 200 }} />
        </View>
    );
});

export const AuthenticateFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const params: {
        session: string,
        endpoint: string | null
    } = useRoute().params as any;
    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('auth.title')} />
            <StatusBar style="dark" />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('auth.title')}</Text>
                </View>
            )}
            <SignStateLoader session={params.session} endpoint={params.endpoint || 'connect.tonhubapi.com'} />
        </>
    );
});