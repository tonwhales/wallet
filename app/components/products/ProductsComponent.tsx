import React, { ReactElement, memo } from "react"
import { Pressable, Text, View } from "react-native"
import { AnimatedProductButton } from "../../fragments/wallet/products/AnimatedProductButton"
import { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { useHoldersCards, useOldWalletsBalances, useStaking, useTheme } from "../../engine/hooks"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import { HoldersProductComponent } from "./HoldersProductComponent"
import { t } from "../../i18n/t"
import { StakingProductComponent } from "./StakingProductComponent"
import { JettonsProductComponent } from "./JettonsProductComponent"
import { HoldersHiddenCards } from "./HoldersHiddenCards"
import { JettonsHiddenComponent } from "./JettonsHiddenComponent"
import { SelectedAccount } from "../../engine/types"

import OldWalletIcon from '@assets/ic_old_wallet.svg';

export const ProductsComponent = memo(({ selected }: { selected: SelectedAccount }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const cards = useHoldersCards(selected.address).data ?? [];
    const totalStaked = useStaking().total;

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

    return (
        <View style={{ backgroundColor: theme.backgroundUnchangeable }}>
            <View style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: theme.surfacePimary,
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
                        color: theme.textPrimary,
                        lineHeight: 24,
                    }}>
                        {t('common.products')}
                    </Text>
                    {!(cards.length === 0 && totalStaked === 0n) && (
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
                                color: theme.accent,
                            }}>
                                {t('products.addNew')}
                            </Text>
                        </Pressable>
                    )}
                </View>

                <HoldersProductComponent key={'holders'} />

                <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
                    <StakingProductComponent key={'pool'} />
                </View>

                <View style={{ marginTop: 8 }}>
                    <JettonsProductComponent key={'jettons'} />
                </View>

                <HoldersHiddenCards key={'holders-hidden'} />
                <JettonsHiddenComponent key={'jettons-hidden'} />
            </View>
        </View>
    );
})