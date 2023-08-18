import BN from "bn.js"
import React, { useLayoutEffect } from "react"
import { LayoutAnimation, Pressable, Text, View } from "react-native"
import OldWalletIcon from '../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../assets/ic_sign.svg';
import TransactionIcon from '../../../assets/ic_transaction.svg';
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
import { JettonsProductComponent } from "./JettonsProductComponent";
import { HoldersHiddenCards } from "./HoldersHiddenCards";

export const ProductsComponent = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const currentJob = engine.products.apps.useState();
    const tonconnectRequests = engine.products.tonConnect.usePendingRequests();
    const cards = engine.products.holders.useCards();
    const totalStaked = engine.products.whalesStakingPools.useStakingCurrent().total;

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
    }, [oldWalletsBalance, currentJob, tonconnectRequests]);

    return (
        <View style={{ backgroundColor: Theme.walletBackground }}>
            <View style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: Theme.white,
                minHeight: 400
            }}>
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
                    marginTop: 20,
                    paddingVertical: 12,
                    marginBottom: 4,
                    paddingHorizontal: 16
                }}>
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        color: Theme.textColor,
                        lineHeight: 24,
                    }}>
                        {t('common.products')}
                    </Text>
                    {!(cards.length === 0 && totalStaked.eq(new BN(0))) && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => navigation.navigate('Products')}
                        >
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '500',
                                lineHeight: 20,
                                color: Theme.accent,
                            }}>
                                {t('products.addNew')}
                            </Text>
                        </Pressable>
                    )}
                </View>

                <HoldersProductButton key={'holders'} />

                <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
                    <StakingProductComponent key={'pool'} />
                </View>

                <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
                    <JettonsProductComponent key={'jettons'} />
                </View>

                <HoldersHiddenCards />
            </View>
        </View>
    )
})