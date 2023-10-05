import { useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { beginCell, Cell, safeSign } from '@ton/core';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { CloseButton } from '../../components/CloseButton';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useTheme } from '../../engine/hooks/useTheme';
import { useCommitCommand } from '../../engine/effects/dapps/useCommitCommand';
import { useCallback, useEffect } from 'react';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

export const SignFragment = fragment(() => {
    const theme = useTheme();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const params: {
        textCell: Cell,
        payloadCell: Cell,
        text: string,
        job: string | null,
        callback: ((ok: boolean, result: Cell | null) => void) | null,
        name: string
    } = useRoute().params as any;
    const safeArea = useSafeAreaInsets();
    const commitCommand = useCommitCommand();
    useEffect(() => {
        return () => {
            if (params && params.job) {
                commitCommand(false, params.job, new Cell());
            }
            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);
    const approve = useCallback(async () => {

        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ cancelable: true });
        } catch (e) {
            navigation.goBack();
            return;
        }

        // Signing
        const data = beginCell()
            .storeRef(params.textCell)
            .storeRef(params.payloadCell)
            .endCell();
        const signed = safeSign(data, walletKeys.keyPair.secretKey);

        // Commit
        if (params.job) {
            await commitCommand(true, params.job, beginCell().storeBuffer(signed).endCell());
        }

        // Callback
        if (params.callback) {
            params.callback(true, beginCell().storeBuffer(signed).endCell());
        }

        // Go back
        navigation.goBack();
    }, [commitCommand]);

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
                <Text style={{ fontSize: 28, marginHorizontal: 32, textAlign: 'center', color: theme.textColor, marginBottom: 8, fontWeight: '500' }}>{params.name}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: theme.textColor, marginBottom: 32 }}>{t('sign.message')}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: theme.textColor, marginBottom: 32 }}>{params.text}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: theme.textSecondary, marginBottom: 32 }}>{t('sign.hint')}</Text>
                <RoundButton title={t('sign.action')} action={approve} size="large" style={{ width: 200 }} />
            </View>
            {/* <SignStateLoader session={params.session} endpoint={params.endpoint || 'connect.tonhubapi.com'} /> */}
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
});