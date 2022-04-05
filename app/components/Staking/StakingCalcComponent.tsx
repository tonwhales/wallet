import BN from "bn.js";
import React from "react"
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native";
import { Address, fromNano, toNano } from "ton";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";

export const StakingCalcComponent = React.memo(({ amount, topUp, member }: {
    amount: string, topUp?: boolean, member?: {
        address: Address,
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    }
}) => {
    const { t } = useTranslation();

    if (topUp && member) {
        const plus = amount === '' ? toNano(0) : toNano(parseFloat(amount.replace(',', '.'))).muln(0.133);
        const yearly = member.balance.muln(0.133);
        const yearlyPlus = amount === '' ? member.balance.muln(0.133) : toNano(parseFloat(amount.replace(',', '.'))).add(member.balance).muln(0.133);
        return (
            <>
                <Text style={{
                    fontSize: 16,
                    color: Theme.textColor,
                    fontWeight: '600',
                    marginTop: 20
                }}>
                    {t('products.staking.calc.topUpTitle')}
                </Text>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingLeft: 16,
                    marginVertical: 10
                }}>
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#7D858A',
                        }}>
                            {t('products.staking.calc.yearlyCurrent')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                <ValueComponent centLength={2} value={yearly} />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={yearly}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 2,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                            />
                        </View>
                    </View>
                    <View style={{
                        height: 1, width: '100%',
                        backgroundColor: Theme.divider,
                    }} />
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#7D858A'
                        }}>
                            {t('products.staking.calc.yearlyTopUp')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: '#4FAE42'
                            }}>
                                <ValueComponent centLength={2} value={yearlyPlus} />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={yearlyPlus}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 2,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                            />
                        </View>
                    </View>
                </View>
                <Text style={{
                    color: '#8E979D',
                    marginTop: -4,
                    fontSize: 13,
                    fontWeight: '400'
                }}>
                    {t('products.staking.calc.note')}
                </Text>
            </>
        )
    }

    const yearly = amount === '' ? toNano(0) : toNano(parseFloat(amount.replace(',', '.'))).muln(0.133);
    const monthly = amount === '' ? toNano(0) : toNano(parseFloat(amount.replace(',', '.'))).muln(0.133).muln(30 / 366);
    const daily = amount === '' ? toNano(0) : toNano(parseFloat(amount.replace(',', '.'))).muln(0.133).muln(1 / 366);

    return (
        <>
            <View style={{
                backgroundColor: 'white',
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                paddingLeft: 16,
                marginVertical: 14
            }}>
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#7D858A'
                    }}>
                        {t('products.staking.calc.yearly')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#4FAE42'
                        }}>
                            {'~'}
                            <ValueComponent centLength={2} value={yearly} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={yearly}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                        />
                    </View>
                </View>
                <View style={{
                    height: 1, width: '100%',
                    backgroundColor: Theme.divider,
                }} />
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#7D858A'
                    }}>
                        {t('products.staking.calc.monthly')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#4FAE42'
                        }}>
                            {'~'}
                            <ValueComponent centLength={2} value={monthly} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={monthly}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                        />
                    </View>
                </View>
                <View style={{
                    height: 1, width: '100%',
                    backgroundColor: Theme.divider,
                }} />
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#7D858A'
                    }}>
                        {t('products.staking.calc.daily')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: '#4FAE42'
                        }}>
                            {'~'}
                            <ValueComponent centLength={2} value={daily} />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={daily}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 2,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                        />
                    </View>
                </View>
            </View>
            <Text style={{
                color: '#8E979D',
                marginTop: -4,
                fontSize: 13,
                fontWeight: '400'
            }}>
                {t('products.staking.calc.note')}
            </Text>
        </>
    );
})