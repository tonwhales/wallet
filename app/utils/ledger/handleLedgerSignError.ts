import { Cell } from "@ton/core";
import { TypedNavigation } from "../useTypedNavigation";
import { Alert } from "react-native";
import { t } from "../../i18n/t";
import { LedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { wait } from "../wait";
import { isLedgerTonAppReady } from "./isLedgerTonAppReady";
import { TransportStatusError } from "@ledgerhq/hw-transport";
import { checkLedgerTonAppVersion } from "./checkLedgerTonAppVersion";

export async function handleLedgerSignError({
    error,
    callback,
    navigation,
    type,
    ledgerContext,
    auth
}: {
    error: any,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    navigation?: TypedNavigation,
    type?: string,
    ledgerContext: LedgerTransport,
    auth?: boolean
}) {
    if (!!callback) {
        callback(false, null);
    }

    let title: string | undefined;

    if (auth) {
        title = t('products.holders.enroll.failed.title');
    }

    if (error instanceof Error && error.name === 'LockedDeviceError') {
        Alert.alert(
            title || t('hardwareWallet.unlockLedgerDescription'),
            title ? t('hardwareWallet.unlockLedgerDescription') : undefined
        );
        return;
    }

    if (!ledgerContext.tonTransport) {
        navigation?.goBack();
        ledgerContext.onShowLedgerConnectionError();
        return;
    }

    const isVersionValid = await checkLedgerTonAppVersion(ledgerContext.tonTransport);
    if (!isVersionValid) {
        await wait(100);
        Alert.alert(
            title || t('hardwareWallet.errors.transactionRejected'),
            t('hardwareWallet.errors.updateApp')
        );
        return;
    }

    try {
        const isAppOpen = await isLedgerTonAppReady(ledgerContext.tonTransport);
        await wait(100);
        if (!isAppOpen) {
            Alert.alert(
                title || t('hardwareWallet.errors.transactionRejected'),
                t('hardwareWallet.errors.openApp')
            );
            return;
        }
    } catch {
        Alert.alert(title || t('hardwareWallet.errors.transactionRejected'));
        return;
    }

    try {
        const settings = await ledgerContext.tonTransport?.getSettings();
        await wait(100);
        if (type === 'unsafe' && !settings.blindSigningEnabled) {
            Alert.alert(
                title || t('hardwareWallet.errors.transactionRejected'),
                t('hardwareWallet.errors.unsafeTransfer')
            );
            return;
        }
    } catch {
        Alert.alert(title || t('hardwareWallet.errors.transactionRejected'));
        return;
    }

    const isCanceled = error instanceof TransportStatusError && (error as any).statusCode === 0x6985;

    if (isCanceled) {
        Alert.alert(
            title || t('hardwareWallet.errors.transactionRejected'),
            t('hardwareWallet.errors.userCanceled'),
            [{ text: t('common.back') }]
        );
        return;
    }

    Alert.alert(
        title || t('hardwareWallet.errors.transactionRejected'),
        undefined,
        [{
            text: t('common.back'),
            onPress: navigation?.goBack
        }]
    );
}