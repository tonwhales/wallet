import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { Platform, StyleProp, Text, TextStyle, View } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { backoff } from '../../utils/time';
import axios from 'axios';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RoundButton } from '../../components/RoundButton';
import { getAppKey, getCurrentAddress } from '../../storage/appState';
import { contractFromPublicKey } from '../../sync/contractFromPublicKey';
import { AppConfig } from '../../AppConfig';
import { Cell } from 'ton';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { sign } from 'ton-crypto';
import { Theme } from '../../Theme';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

const SignStateLoader = React.memo((props: { session: string, endpoint: string }) => {
    const navigation = useTypedNavigation();
    const [state, setState] = React.useState<'loading' | 'expired' | 'initing' | 'completed'>('loading');
    React.useEffect(() => {
        let ended = false;
        backoff(async () => {
            if (ended) {
                return;
            }
            let currentState = await axios.get('https://' + props.endpoint + '/connect/' + props.session);
            if (ended) {
                return;
            }
            if (currentState.data.state === 'not_found') {
                setState('expired');
                return;
            }
            if (currentState.data.state === 'initing') {
                setState('initing');
                return;
            }
            if (currentState.data.state === 'ready') {
                setState('completed');
                return;
            }
            setState('expired');
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

        // Load data
        const contract = await contractFromPublicKey(acc.publicKey);
        let walletConfig = contract.source.backup();
        let walletType = contract.source.type;
        let address = contract.address.toFriendly({ testOnly: AppConfig.isTestnet });
        let answerKey = await getAppKey();

        // Sign
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            console.warn(e);
            return;
        }
        let toSign = new Cell();
        toSign.bits.writeBuffer(Buffer.from(props.session, 'base64'));
        toSign.bits.writeAddress(contract.address);
        let hashSign = toSign.hash();
        let signature = sign(hashSign, walletKeys.keyPair.secretKey);

        // Notify
        await backoff(async () => {
            if (!active.current) {
                return;
            }
            await axios.post('https://' + props.endpoint + '/connect/answer', {
                key: props.session,
                answerKey: answerKey,
                address: address,
                walletType,
                walletConfig,
                walletSig: signature.toString('base64')
            });
            if (!active.current) {
                return;
            }
            navigation.goBack();
        });
    }, []);

    // When loading
    if (state === 'loading') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <LoadingIndicator simple={true} />
            </View>
        )
    }

    // Expired
    if (state === 'expired') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.expired')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
            </View>
        );
    }

    // Completed
    if (state === 'completed') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.completed')}</Text>
                <RoundButton title={t('common.back')} onPress={() => navigation.goBack()} size="large" style={{ width: 200 }} display="outline" />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('auth.message')}</Text>
            <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: Theme.textSecondary, marginBottom: 32 }}>{t('auth.hint')}</Text>
            <RoundButton title={t('auth.action')} action={approve} size="large" style={{ width: 200 }} />
        </View>
    );
});

export const SignFragment = fragment(() => {
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