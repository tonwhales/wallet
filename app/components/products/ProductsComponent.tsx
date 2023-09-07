import BN from "bn.js"
import React, { ReactElement, memo } from "react"
import { Pressable, Text, View } from "react-native"
import OldWalletIcon from '../../../assets/ic_old_wallet.svg';
import { AnimatedProductButton } from "./AnimatedProductButton"
import { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { HoldersProductButton } from "./HoldersProductButton"
import { useEngine } from "../../engine/Engine";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingProductComponent } from "./StakingProductComponent";
import { t } from "../../i18n/t";
import { JettonsProductComponent } from "./JettonsProductComponent";
import { HoldersHiddenCards } from "./HoldersHiddenCards";

export const ProductsComponent = memo(() => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const cards = engine.products.holders.useCards();
    const totalStaked = engine.products.whalesStakingPools.useStakingCurrent().total;

    // Resolve accounts
    let accounts: ReactElement[] = [];
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

    return (
        <View style={{ backgroundColor: Theme.backgroundUnchangeable }}>
            <View style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: Theme.white,
                minHeight: 400
            }}>
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
                        color: Theme.textPrimary,
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

                <HoldersHiddenCards key={'holders-hidden'}/>
            </View>
        </View>
    )
})