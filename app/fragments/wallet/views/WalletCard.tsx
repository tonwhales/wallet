import { memo, useCallback, useMemo } from "react";
import { useAccountLite, useHoldersAccounts, useLiquidStakingBalance, usePrice, useStaking, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSpecialJetton } from "../../../engine/hooks/jettons/useSpecialJetton";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { reduceHoldersBalances } from "../../../utils/reduceHoldersBalances";
import { LinearGradient } from "expo-linear-gradient";
import { AppModeToggle } from "../../../components/AppModeToggle";
import { PriceComponent } from "../../../components/PriceComponent";
import { Typography } from "../../../components/styles";
import { Platform, Pressable, View } from "react-native";
import { BlurView } from "expo-blur";
import { Address, toNano } from "@ton/core";

export const WalletCard = memo(({ address, height, walletHeaderHeight }: { address: Address, height: number, walletHeaderHeight: number }) => {
    const account = useAccountLite(address);
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const specialJetton = useSpecialJetton(address);
    const staking = useStaking();
    const liquidBalance = useLiquidStakingBalance(address);
    const holdersCards = useHoldersAccounts(address).data?.accounts;
    const [price] = usePrice();
    const [isWalletMode] = useAppMode(address);

    const stakingBalance = useMemo(() => {
        if (!staking && !liquidBalance) {
            return 0n;
        }
        return liquidBalance + staking.total;
    }, [staking, liquidBalance]);

    const walletBalance = useMemo(() => {
        const accountWithStaking = (account ? account?.balance : 0n)
            + (stakingBalance || 0n)

        return accountWithStaking + (specialJetton?.toTon || 0n);
    }, [account, stakingBalance, specialJetton?.toTon]);

    const cardsBalance = useMemo(() => {
        const cardsBalance = reduceHoldersBalances(holdersCards ?? [], price?.price?.usd ?? 1);

        return (cardsBalance || 0n);
    }, [stakingBalance, holdersCards, price?.price?.usd]);

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

    return (
        <LinearGradient
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: walletHeaderHeight,
                paddingHorizontal: 16,
                backgroundColor: theme.backgroundUnchangeable,
                borderColor: 'white',
                height,
            }}
            colors={[isWalletMode ? theme.backgroundUnchangeable : theme.cornflowerBlue, theme.backgroundUnchangeable]}
            start={[1, 0]}
            end={[1, 1]}
        >
            <View>
                <AppModeToggle />
                <PriceComponent
                    amount={isWalletMode ? walletBalance : cardsBalance}
                    style={{
                        alignSelf: 'center',
                        backgroundColor: theme.transparent,
                        paddingHorizontal: undefined,
                        paddingVertical: undefined,
                        paddingLeft: undefined,
                        borderRadius: undefined,
                        height: undefined,
                        marginTop: 28,
                    }}
                    textStyle={[{ color: theme.textOnsurfaceOnDark }, Typography.semiBold32_38]}
                    centsTextStyle={{ color: theme.textSecondary }}
                    theme={theme}
                />
                {!account && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            overflow: 'hidden',
                            borderRadius: 8,
                        }}
                    >
                        {Platform.OS === 'android' ? (
                            <View
                                style={{
                                    flexGrow: 1,
                                    backgroundColor: theme.surfaceOnBg,
                                }}
                            />
                        ) : (
                            <BlurView
                                tint={theme.style === 'dark' ? 'dark' : 'light'}
                                style={{ flexGrow: 1 }}
                            />
                        )}
                    </View>
                )}
            </View>
            <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
                onPress={navigateToCurrencySettings}
            >
                <PriceComponent
                    showSign
                    amount={toNano(1)}
                    style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }}
                    textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                    theme={theme}
                />
            </Pressable>
        </LinearGradient>
    );
});
WalletCard.displayName = 'WalletCard';
