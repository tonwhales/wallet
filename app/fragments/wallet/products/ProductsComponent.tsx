import React, { ReactElement, memo, useLayoutEffect } from "react"
import { Alert, LayoutAnimation, Text, View } from "react-native"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { StakingProductComponent } from "../../../components/staking/StakingProductComponent"
import { t } from "../../../i18n/t"
import { JettonProduct } from "./JettonProduct"
import { getConnectionReferences } from "../../../storage/appState"
import { extractDomain } from "../../../engine/utils/extractDomain"
import HardwareWalletIcon from '../../../../assets/ic_ledger.svg';
import { AnimatedProductButton } from "./AnimatedProductButton"
import { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { useTheme } from '../../../engine/hooks/useTheme';
import { HoldersProductButton } from "./HoldersProductButton"
import { useOldWalletsBalance } from '../../../engine/hooks/useOldWalletsBalance';
import { useCurrentJob } from '../../../engine/hooks/dapps/useCurrentJob';
import { useJettons } from '../../../engine/hooks/useJettons';
import { useExtensions } from '../../../engine/hooks/dapps/useExtensions';
import { useLedger } from '../../../engine/hooks/useLedger';
import { useTonConnectExtensions } from '../../../engine/hooks/useTonConnectExtenstions';
import { useTonConnectPendingRequests } from '../../../engine/hooks/useTonConnectPendingRequests';
import { useCards } from '../../../engine/hooks/useCards';
import { useNetwork } from '../../../engine/hooks/useNetwork';
import { prepareTonConnectRequest } from '../../../engine/legacy/tonconnect/utils';
import { DappButton } from "./DappButton";
import { Address } from "@ton/core";

export const ProductsComponent = memo(({ selected }: {
    selected: {
        address: Address;
        addressString: string;
        publicKey: Buffer;
        secretKeyEnc: Buffer;
        utilityKey: Buffer;
    }
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalance();
    const [currentJob,] = useCurrentJob();
    const jettons = useJettons(selected.addressString);
    const ledger = useLedger();
    const cards = useCards();

    const [installedExtensions,] = useExtensions();
    const extensions = Object.entries(installedExtensions.installed).map(([key, ext]) => ({ ...ext, key }));

    const tonconnectExtensions = useTonConnectExtensions();
    const tonconnectRequests = useTonConnectPendingRequests();

    // Resolve accounts
    let accounts: ReactElement[] = [];
    if (oldWalletsBalance > 0n) {
        accounts.push(
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                key={'old-wallets'}
                name={t('products.oldWallets.title')}
                subtitle={t("products.oldWallets.subtitle")}
                icon={OldWalletIcon}
                value={oldWalletsBalance}
                onPress={() => navigation.navigate('Migration')}
                style={{ marginVertical: 4 }}
            />
        );
    }

    for (let j of jettons) {
        if (j.balance > 0n) {
            accounts.push(
                <JettonProduct
                    key={'jt' + j.wallet.toString()}
                    jetton={j}
                    navigation={navigation}
                />
            );
        }
    }

    const removeLedger = React.useCallback(() => {
        Alert.alert(t('hardwareWallet.ledger'), t('hardwareWallet.confirm.remove'), [{ text: t('common.cancel') }, {
            text: t('common.continue'),
            style: 'destructive',
            onPress: () => {
                // TODO
                // setLedger(false);
            }
        }]);
    }, []);

    // Resolve apps
    let apps: React.ReactElement[] = [];

    if (isTestnet) {
        cards.map((c) => {
            apps.push(<HoldersProductButton key={c.id} account={c} />)
        });
        apps.push(<HoldersProductButton key={'zenpay-add'} />)
    }

    for (let e of extensions) {
        apps.push(
            <DappButton
                key={e.key}
                appKey={e.key}
                url={e.url}
                name={e.title}
                tonconnect={false}
            />
        );
    }

    for (let e of tonconnectExtensions) {
        apps.push(
            <DappButton
                key={e.key}
                appKey={e.key}
                url={e.url}
                name={e.name}
                tonconnect={true}
            />
        );
    }

    if (ledger) {
        apps.push(
            <AnimatedProductButton
                key={'ledger'}
                entering={FadeInUp}
                exiting={FadeOutDown}
                name={t('hardwareWallet.title')}
                subtitle={t('hardwareWallet.description')}
                icon={HardwareWalletIcon}
                iconProps={{ width: 32, height: 32, color: 'black' }}
                iconViewStyle={{
                    backgroundColor: 'transparent'
                }}
                style={{ marginVertical: 4 }}
                value={null}
                onLongPress={removeLedger}
                onPress={() => {
                    navigation.navigate('Ledger');
                }}
            />
        );
    }

    // Resolve tonconnect requests
    let tonconnect: React.ReactElement[] = [];
    for (let r of tonconnectRequests) {
        const prepared = prepareTonConnectRequest(r);
        if (r.method === 'sendTransaction' && prepared) {
            tonconnect.push(
                <AnimatedProductButton
                    key={r.from}
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={TransactionIcon}
                    value={null}
                    onPress={() => {
                        navigation.navigateTransfer({
                            text: null,
                            order: {
                                messages: prepared.messages,
                                app: (prepared.app && prepared.app.connectedApp) ? {
                                    title: prepared.app.connectedApp.name,
                                    domain: extractDomain(prepared.app.connectedApp.url),
                                } : undefined
                            },
                            job: null,
                            callback: (ok, result) => tonConnectTransactionCallback(ok, result, prepared.request, prepared.sessionCrypto, engine)
                        })
                    }}
                />
            );
        }
    }

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [extensions, jettons, oldWalletsBalance, currentJob, tonconnectRequests]);

    return (
        <View style={{ paddingTop: 8 }}>
            {tonconnect}
            {!!currentJob && currentJob.job.type === 'transaction' && (
                <AnimatedProductButton
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={TransactionIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'transaction') {
                            navigation.navigateTransfer({
                                order: {
                                    messages: [{
                                        target: currentJob.job.target.toString({ testOnly: isTestnet }),
                                        amount: currentJob.job.amount,
                                        payload: currentJob.job.payload,
                                        stateInit: currentJob.job.stateInit,
                                        amountAll: false
                                    }]
                                },
                                job: currentJob.jobRaw,
                                text: currentJob.job.text,
                                callback: null
                            });
                        }
                    }}
                />
            )}
            {!!currentJob && currentJob.job.type === 'sign' && (
                <AnimatedProductButton
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.signatureRequest.title')}
                    subtitle={t('products.signatureRequest.subtitle')}
                    icon={SignIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'sign') {
                            const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(currentJob.key));
                            if (!connection) {
                                return; // Just in case
                            }
                            navigation.navigateSign({
                                text: currentJob.job.text,
                                textCell: currentJob.job.textCell,
                                payloadCell: currentJob.job.payloadCell,
                                job: currentJob.jobRaw,
                                callback: null,
                                name: connection.name
                            });
                        }
                    }}
                />
            )}

            <View style={{ marginTop: 8 }}>
                <StakingProductComponent key={'pool'} />
            </View>

            {(apps.length > 0) && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.services')}</Text>
                    </View>
                    {apps}
                </>
            )}

            {accounts.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.accounts')}</Text>
                    </View>
                    {accounts}
                </>
            )}
        </View>
    )
})