import BN from "bn.js"
import React from "react"
import { Alert, Pressable, Text, View } from "react-native"
import { ProductButton } from "./ProductButton"
import { useEngine } from "../../../engine/Engine"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { AppConfig } from "../../../AppConfig"
import { StakingProductComponent } from "../../../components/Staking/StakingProductComponent"
import { t } from "../../../i18n/t"
import { JettonProduct } from "./JettonProduct"
import { Theme } from "../../../Theme"
import { getConnectionReferences } from "../../../storage/appState"
import { extractDomain } from "../../../engine/utils/extractDomain"
import { ZenPayProductButton } from "../../zenpay/components/ZenPayProductButton"

export const ProductsComponent = React.memo(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const currentJob = engine.products.apps.useState();
    const jettons = engine.products.main.useJettons().filter((j) => !j.disabled);
    const extensions = engine.products.extensions.useExtensions();
    const cards = engine.products.zenPay.useCards();
    const openExtension = React.useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = engine.persistence.domainKeys.getValue(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);

    // Resolve accounts
    let accounts: React.ReactElement[] = [];
    if (oldWalletsBalance.gt(new BN(0))) {
        accounts.push(
            <ProductButton
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

    // Resolve apps
    let apps: React.ReactElement[] = [];
    for (let e of extensions) {
        apps.push(
            <ProductButton
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

    // Resolve products
    let products: React.ReactElement[] = [];

    products.push(<StakingProductComponent key={'pool'} />);

    if (AppConfig.isTestnet) {
        cards.map((c) => {
            products.push(<ZenPayProductButton engine={engine} key={c.id} card={c} />)
        });
        products.push(<ZenPayProductButton engine={engine} key={'zenpay-add'} />)
    }

    return (
        <View style={{ paddingTop: 8 }}>
            {currentJob && currentJob.job.type === 'transaction' && (
                <ProductButton
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={TransactionIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'transaction') {
                            navigation.navigateTransfer({
                                order: {
                                    target: currentJob.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    amount: currentJob.job.amount,
                                    payload: currentJob.job.payload,
                                    stateInit: currentJob.job.stateInit,
                                    amountAll: false
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
                <ProductButton
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

            {products.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('common.products')}</Text>
                    </View>
                    {products}
                </>
            )}

            {apps.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.services')}</Text>
                    </View>
                    {apps}
                </>
            )}

            {accounts.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.accounts')}</Text>
                    </View>
                    {accounts}
                </>
            )}
        </View>
    )
})