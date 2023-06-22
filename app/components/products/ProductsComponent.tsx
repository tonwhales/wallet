import BN from "bn.js"
import React, { useLayoutEffect } from "react"
import { Alert, LayoutAnimation, Text, View } from "react-native"
import { ProductButton } from "./ProductButton"
import { useEngine } from "../../../engine/Engine"
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
import { HoldersProductButton } from "../../holders/components/HoldersProductButton"
import { AnimatedProductButton } from "./AnimatedProductButton"
import { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { HoldersProductButton } from "./HoldersProductButton"
import { useEngine } from "../../engine/Engine";
import { prepareTonConnectRequest, tonConnectTransactionCallback } from "../../engine/tonconnect/utils";
import { extractDomain } from "../../engine/utils/extractDomain";
import { getConnectionReferences } from "../../storage/appState";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingProductComponent } from "./StakingProductComponent";
import { t } from "../../i18n/t";

export const ProductsComponent = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const currentJob = engine.products.apps.useState();
    const jettons = engine.products.main.useJettons().filter((j) => !j.disabled);
    const extensions = engine.products.extensions.useExtensions();
    const ledger = engine.products.settings.useLedger();
    const cards = engine.products.holders.useCards();
    const tonconnectExtensions = engine.products.tonConnect.useExtensions();
    const tonconnectRequests = engine.products.tonConnect.usePendingRequests();

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
                <JettonProductButton
                    key={'jt' + j.wallet.toFriendly()}
                    jetton={j}
                    navigation={navigation}
                    engine={engine}
                />
            );
        }
    }

    let removeExtension = React.useCallback((key: string) => {
        Alert.alert(t('auth.apps.delete.title'), t('auth.apps.delete.message'), [{ text: t('common.cancel') }, {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(key);
            }
        }]);
    }, []);

    const removeLedger = React.useCallback(() => {
        Alert.alert(t('hardwareWallet.ledger'), t('hardwareWallet.confirm.remove'), [{ text: t('common.cancel') }, {
            text: t('common.continue'),
            style: 'destructive',
            onPress: () => {
                engine.products.settings.setLedger(false);
            }
        }]);
    }, []);

    // Resolve apps
    let apps: React.ReactElement[] = [];

    if (AppConfig.isTestnet) {
        cards.map((c) => {
            apps.push(<HoldersProductButton engine={engine} key={c.id} account={c} />)
        });
        apps.push(<HoldersProductButton engine={engine} key={'zenpay-add'} />)
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
        <View style={{ paddingHorizontal: 16 }}>
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
                                        target: currentJob.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
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

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                marginTop: 16,
                paddingVertical: 12,
                marginBottom: 4
            }}>
                <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: Theme.textColor,
                }}>
                    {t('common.products')}
                </Text>
                <Pressable>
                    <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: Theme.accent,
                    }}>
                        {t('products.addNew')}
                    </Text>
                </Pressable>
            </View>

            <HoldersProductButton />

            <View style={{ marginTop: 8 }}>
                <StakingProductComponent key={'pool'} />
            </View>
        </View>
    )
})