import { useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { beginCell, Cell, safeSign } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { getConnectionReferences, getCurrentAddress } from '../../storage/appState';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { useAccount } from '../../sync/Engine';
import { parseJob } from '../../sync/parse/parseJob';
import { Theme } from '../../Theme';
import { getDeviceEncryption } from '../../utils/getDeviceEncryption';
import { usePasscodeAuth } from '../../utils/PasscodeContext';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

export const SignFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const passcodeAuth = usePasscodeAuth();
    const params: {
        job: string
    } = useRoute().params as any;
    const [account, engine] = useAccount();
    const acc = React.useMemo(() => getCurrentAddress(), []);
    const safeArea = useSafeAreaInsets();
    const job = parseJob(Cell.fromBoc(Buffer.from(params.job, 'base64'))[0].beginParse());
    if (!job || job.job.type !== 'sign') {
        throw Error('Internal error');
    }
    const jobBody = job.job;
    React.useEffect(() => {
        return () => {
            if (params && params.job) {
                engine.products.apps.commitCommand(false, params.job, new Cell());
            }
        }
    }, []);
    const approve = React.useCallback(async () => {

        // Read key
        let walletKeys: WalletKeys;
        try {
            const encryption = await getDeviceEncryption();
            if (Platform.OS === 'android' && encryption === 'passcode') {
                walletKeys = await passcodeAuth!.authenticateAsync();
            } else {
                walletKeys = await loadWalletKeys(acc.secretKeyEnc);
            }
        } catch (e) {
            navigation.goBack();
            return;
        }

        // Signing
        const data = beginCell()
            .storeRef(jobBody.textCell)
            .storeRef(jobBody.payloadCell)
            .endCell();
        const signed = safeSign(data, walletKeys.keyPair.secretKey);

        // Commit
        await engine.products.apps.commitCommand(true, params.job, beginCell().storeBuffer(signed).endCell());

        // Go backj
        navigation.goBack();
    }, []);
    const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(job.key));
    if (!connection) {
        return null; // Just in case
    }
    let name = connection ? connection.name : 'Unknown';

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('sign.title')} />
            <StatusBar style="dark" />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('sign.title')}</Text>
                </View>
            )}

            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 8, fontWeight: '500' }}>{name}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{t('sign.message')}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: Theme.textColor, marginBottom: 32 }}>{jobBody.text}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: Theme.textSecondary, marginBottom: 32 }}>{t('sign.hint')}</Text>
                <RoundButton title={t('sign.action')} action={approve} size="large" style={{ width: 200 }} />
            </View>
            {/* <SignStateLoader session={params.session} endpoint={params.endpoint || 'connect.tonhubapi.com'} /> */}
        </>
    );
});