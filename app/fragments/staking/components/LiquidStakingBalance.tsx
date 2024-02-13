import { memo } from "react";
import { View, Image, Text } from "react-native";
import { useTheme } from "../../../engine/hooks";
import { ValueComponent } from "../../../components/ValueComponent";
import { Typography } from "../../../components/styles";
import { PriceComponent } from "../../../components/PriceComponent";
import { ItemDivider } from "../../../components/ItemDivider";
import { t } from "../../../i18n/t";

export const LiquidStakingMember = memo(({ balance, rateWithdraw }: { balance: bigint, rateWithdraw: bigint, }) => {
    const theme = useTheme();

    return (
        <View style={{
            borderRadius: 20,
            backgroundColor: theme.surfaceOnElevation,
            padding: 20,
            marginBottom: 16,
        }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{
                    height: 46, width: 46,
                    justifyContent: 'center', alignItems: 'center',
                    borderRadius: 23,
                    marginRight: 12
                }}>
                    <Image
                        source={require('@assets/ic-wston.png')}
                        style={{
                            height: 46,
                            width: 46,
                        }}
                    />
                    <View style={[{
                        position: 'absolute',
                        justifyContent: 'center', alignItems: 'center',
                        bottom: -2, right: -2,
                        width: 20, height: 20, borderRadius: 20,
                        backgroundColor: theme.surfaceOnElevation
                    }]}>

                        <Image
                            source={require('@assets/ic-verified.png')}
                            style={{ width: 20, height: 20 }}
                        />
                    </View>
                </View>
                <View style={{ flexGrow: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            {'wsTON'}
                        </Text>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            <ValueComponent
                                value={balance}
                                precision={4}
                                centFontStyle={{ opacity: 0.5 }}
                            />
                            <Text style={{ color: theme.textSecondary }}>{' wsTON'}</Text>
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {'Whales Liquid Token'}
                        </Text>
                        <PriceComponent
                            amount={balance}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined
                            }}
                            textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                            theme={theme}
                        />
                    </View>
                </View>
            </View>
            <ItemDivider marginHorizontal={0} marginVertical={20} />
            <View style={{ backgroundColor: theme.backgroundPrimary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {'1 wsTON = '}
                    <ValueComponent
                        value={rateWithdraw}
                        precision={9}
                        suffix={' TON'}
                    />
                </Text>
            </View>
            <Text style={[{ color: theme.textSecondary, marginTop: 4, paddingHorizontal: 16 }, Typography.regular15_20]}>
                {t('products.staking.pools.liquidDescription')}
            </Text>
        </View>
    );
});