import BN from "bn.js"
import React, { useLayoutEffect } from "react"
import { LayoutAnimation, Pressable, Text, useWindowDimensions, View } from "react-native"
import { useEngine } from "../../../engine/Engine"
import IconAdd from '../../../../assets/ic_action_add.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { AppConfig } from "../../../AppConfig"
import { t } from "../../../i18n/t"
import { Theme } from "../../../Theme"
import { getConnectionReferences } from "../../../storage/appState"
import { AnimatedProductButton } from "./AnimatedProductButton"
import { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { CardProductButton, gradientColorsMap } from "./CardProductButton"
import { ValueComponent } from "../../../components/ValueComponent"
import { PriceComponent } from "../../../components/PriceComponent"
import { WalletActionButton } from "../../../components/WalletActionButton"
import { ExtensionsProductButton } from "./ExtensionsProductButton";

export const ProductsComponent = React.memo(({ hidden }: { hidden?: boolean }) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWallets = engine.products.legacy.useStateFull();
    const currentJob = engine.products.apps.useState();
    const jettons = engine.products.main.useJettons().filter((j) => !j.disabled);
    const staking = engine.products.whalesStakingPools.useStaking();
    const account = engine.products.main.useAccount();
    const showJoin = staking.total.eq(new BN(0));

    // Resolve oldWallets
    let oldAccounts = oldWallets.filter((a) => a.balance.gt(new BN(0)));

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [jettons, oldWallets, currentJob,]);

    const window = useWindowDimensions();
    const itemWidth = window.width / 2 - 16 - 7;

    return (
        <>
            {currentJob && currentJob.job.type === 'transaction' && (
                <AnimatedProductButton
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={TransactionIcon}
                    value={null}
                    style={{ marginTop: 8 }}
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
                <AnimatedProductButton
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.signatureRequest.title')}
                    subtitle={t('products.signatureRequest.subtitle')}
                    icon={SignIcon}
                    value={null}
                    style={{ marginTop: 8 }}
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
            <View style={{ marginTop: 30, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', }}>
                {(jettons.length > 0 || oldAccounts.length > 0) && (
                    <CardProductButton
                        key={'accounts'}
                        title={`${t('products.accounts')} (${jettons.length + (oldAccounts.length > 0 ? oldAccounts.length + 1 : 1)})`}
                        description={`TON, ${jettons.map((j) => j.name).join(', ')}`}
                        width={itemWidth}
                        height={itemWidth}
                        style={{ marginBottom: 14 }}
                        onPress={() => navigation.navigate('Accounts')}
                        balance={<View>
                            <View>
                                <PriceComponent
                                    amount={account?.balance ?? new BN(0)}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        height: undefined,
                                        marginBottom: 4
                                    }}
                                    textStyle={{
                                        fontSize: 16,
                                        fontWeight: '700',
                                        color: Theme.textColor,
                                    }}
                                    hidden={hidden}
                                />
                                <ValueComponent
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                    style={{
                                        fontSize: 14,
                                        fontWeight: '400',
                                        color: Theme.textColor,
                                        opacity: 0.7
                                    }}
                                    value={account?.balance ?? new BN(0)}
                                    precision={2}
                                    suffix={' TON'}
                                    hidden={hidden}
                                />
                            </View>
                        </View>}
                    />
                )}
                <CardProductButton
                    key={'staking'}
                    title={t('products.staking.title')}
                    description={!showJoin ? t('products.staking.subtitle.joined') : AppConfig.isTestnet ? t('products.staking.subtitle.devPromo') : t('products.staking.subtitle.join')}
                    width={itemWidth}
                    height={itemWidth}
                    style={{ marginBottom: 14 }}
                    gradientColors={gradientColorsMap[1]}
                    button={showJoin ? { title: t('products.staking.joinButton'), color: Theme.success, textColor: 'white' } : undefined}
                    onPress={() => navigation.navigate('StakingPools')}
                    balance={!showJoin
                        ? (
                            <View>
                                <PriceComponent
                                    amount={staking.total}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        height: undefined,
                                        marginBottom: 4
                                    }}
                                    textStyle={{
                                        fontSize: 16,
                                        fontWeight: '700',
                                        color: Theme.textColor,
                                    }}
                                    hidden={hidden}
                                />
                                <ValueComponent
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                    style={{
                                        fontSize: 14,
                                        fontWeight: '400',
                                        color: Theme.textColor,
                                        opacity: 0.7
                                    }}
                                    value={staking.total}
                                    precision={2}
                                    suffix={' TON'}
                                    hidden={hidden}
                                />
                            </View>
                        )
                        : undefined
                    }
                />

                <ExtensionsProductButton engine={engine} itemWidth={itemWidth} />

                <Pressable
                    style={({ pressed }) => {
                        return ([{
                            height: itemWidth, width: itemWidth,
                            borderRadius: 20,
                            overflow: 'hidden',
                            padding: 14,
                            opacity: pressed ? 0.3 : 1,
                            marginBottom: 14,
                            backgroundColor: Theme.item,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }]);
                    }}
                // onPress={onPress}
                // onLongPress={onLongPress}
                >
                    <WalletActionButton
                        icon={IconAdd}
                        title={t('products.add')}
                        disablePressed
                    />
                </Pressable>
            </View>
        </>
    )
})