import { useRoute } from '@react-navigation/native';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { beginCell, Cell, safeSign } from '@ton/core';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useTheme } from '../../engine/hooks';
import { useCommitCommand } from '../../engine/hooks';
import { useCallback, useEffect } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBar } from 'expo-status-bar';

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
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark' })} />
            <ScreenHeader
                title={t('sign.title')}
                onClosePressed={navigation.goBack}
            />

            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, marginHorizontal: 32, textAlign: 'center', color: theme.textPrimary, marginBottom: 8, fontWeight: '500' }}>{params.name}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: theme.textPrimary, marginBottom: 32 }}>{t('sign.message')}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: theme.textPrimary, marginBottom: 32 }}>{params.text}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 32, textAlign: 'center', color: theme.textSecondary, marginBottom: 32 }}>{t('sign.hint')}</Text>
                <RoundButton title={t('sign.action')} action={approve} size="large" style={{ width: 200 }} />
            </View>
        </>
    );
});