import { memo, useMemo } from "react";
import { useAccountLite, useHoldersAccounts, useLiquidStakingBalance, usePrice, useSolanaSavingsBalance, useStaking, useTheme } from "../../../engine/hooks";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { reduceHoldersBalances } from "../../../utils/reduceHoldersBalances";
import { LinearGradient } from "expo-linear-gradient";
import { PriceComponent } from "../../../components/PriceComponent";
import { Typography } from "../../../components/styles";
import { Platform, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Address } from "@ton/core";
import { WalletAddress } from "../../../components/address/WalletAddress";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { solanaAddressFromPublicKey } from "../../../utils/solana/address";
import { useSavingsBalance } from "../../../engine/hooks/jettons/useSavingsBalance";
import { t } from "../../../i18n/t";
import { APP_MODE_TOGGLE_HEIGHT } from "../../../utils/constants";

export const WalletCard = memo(({ address, pubKey, height, walletHeaderHeight, isLedger }: { address: Address, pubKey: Buffer, height: number, walletHeaderHeight: number, isLedger?: boolean }) => {
    const solanaAddress = solanaAddressFromPublicKey(pubKey).toString();
    const { specialToTon, savingsToTon } = useSavingsBalance(address);
    const { solAssetsToTon: solanaTotalBalance } = useSolanaSavingsBalance(solanaAddress);
    const account = useAccountLite(address);
    const theme = useTheme();
    const staking = useStaking(address);
    const liquidBalance = useLiquidStakingBalance(address);
    const holdersCards = useHoldersAccounts(address, isLedger ? undefined : solanaAddress).data?.accounts;
    const [price] = usePrice();
    const [isWalletMode] = useAppMode(address);
    const bottomBarHeight = useBottomTabBarHeight();

    const stakingBalance = useMemo(() => {
        if (!staking && !liquidBalance) {
            return 0n;
        }
        return liquidBalance + staking.total;
    }, [staking, liquidBalance]);

    const walletBalance = useMemo(() => {
        const accountWithStaking = (account?.balance ?? 0n) + (stakingBalance || 0n);

        let balance = accountWithStaking + savingsToTon + specialToTon;
        if (!isLedger) {
            balance += solanaTotalBalance;
        }

        return balance;
    }, [account, stakingBalance, isLedger, solanaTotalBalance, savingsToTon, specialToTon]);

    const cardsBalance = useMemo(() => {
        const cardsBalance = reduceHoldersBalances(holdersCards ?? [], price?.price?.usd ?? 1);

        return (cardsBalance || 0n);
    }, [stakingBalance, holdersCards, price?.price?.usd]);

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
                        marginTop: 28 + APP_MODE_TOGGLE_HEIGHT,
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
                            marginTop: 28,
                        }}
                    >
                        {Platform.OS === 'android' ? (
                            <View
                                style={{
                                    flexGrow: 1,
                                    backgroundColor: theme.backgroundUnchangeable,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                {!isWalletMode && (
                    <Text style={[{
                        color: theme.textUnchangeable,
                        opacity: 0.5,
                        fontFamily: undefined
                    }, Typography.regular15_20]}>{`${t('wallet.owner')}: `}</Text>
                )}
                <WalletAddress
                    address={address}
                    elipsise={{ start: 6, end: 6 }}
                    textStyle={[{
                        color: theme.textUnchangeable,
                        opacity: 0.5,
                        fontFamily: undefined
                    }, Typography.regular15_20]}
                    disableContextMenu
                    copyOnPress
                    copyToastProps={Platform.select({
                        ios: { marginBottom: 24 + bottomBarHeight, },
                        android: { marginBottom: 16, }
                    })}
                    theme={theme}
                    withCopyIcon
                />
            </View>

        </LinearGradient>
    );
});
WalletCard.displayName = 'WalletCard';
