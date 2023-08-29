import BN from "bn.js"
import React, { useLayoutEffect } from "react"
import { Alert, LayoutAnimation, Text, View } from "react-native"
import { ProductButton } from "./ProductButton"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { StakingProductComponent } from "../../../components/Staking/StakingProductComponent"
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
import { useCurrentJob } from '../../../engine/hooks/useCurrentJob';
import { useJettons } from '../../../engine/hooks/useJettons';
import { useExtensions } from '../../../engine/hooks/useExtensions';
import { useLedger } from '../../../engine/hooks/useLedger';
import { useTonConnectExtensions } from '../../../engine/hooks/useTonConnectExtenstions';
import { useTonConnectPendingRequests } from '../../../engine/hooks/useTonConnectPendingRequests';
import { useCards } from '../../../engine/hooks/useCards';

export const ProductsComponent = React.memo(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalance();
    const currentJob = useCurrentJob();
    const jettons = useJettons().filter((j: any) => !j.disabled);
    const extensions = useExtensions();
    const ledger = useLedger();
    const cards = useCards();
    const tonconnectExtensions = useTonConnectExtensions();
    const tonconnectRequests = useTonConnectPendingRequests();
    const openExtension = React.useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }

        navigation.navigate('Install', { url });
        // let k = engine.persistence.domainKeys.getValue(domain);
        // if (!k) {
        //     navigation.navigate('Install', { url });
        // } else {
        //     navigation.navigate('App', { url });
        // }
    }, []);

    // Resolve accounts
    let accounts: React.ReactElement[] = [];
    if (oldWalletsBalance.gt(new BN(0))) {
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
        if (j.balance.gt(new BN(0))) {
            accounts.push(
                <JettonProduct
                    key={'jt' + j.wallet.toFriendly()}
                    jetton={j}
                    navigation={navigation}
                />
            );
        }
    }

    let removeExtension = React.useCallback((key: string) => {
        Alert.alert(t('auth.apps.delete.title'), t('auth.apps.delete.message'), [{ text: t('common.cancel') }, {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
                // TODO:
                // removeExtension(key);
            }
        }]);
    }, []);

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
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                key={e.key}
                name={e.name}
                subtitle={e.description ? e.description : e.url}
                image={e.image?.url}
                blurhash={e.image?.blurhash}
                value={null}
                onLongPress={() => removeExtension(e.key)}
                onPress={() => openExtension(e.url)}
                extension={true}
                style={{ marginVertical: 4 }}
            />
        );
    }

    for (let e of tonconnectExtensions) {
        apps.push(
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                key={e.key}
                name={e.name}
                subtitle={e.url}
                image={e.image ?? undefined}
                value={null}
                onPress={() => {
                    navigation.navigate('ConnectApp', { url: e.url });
                }}
                extension={true}
                style={{ marginVertical: 4 }}
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
        const prepared = prepareTonConnectRequest(r, engine);
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
            {currentJob && currentJob.job.type === 'transaction' && (
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
                                        target: currentJob.job.target.toFriendly({ testOnly: isTestnet }),
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
            {currentJob && currentJob.job.type === 'sign' && (
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