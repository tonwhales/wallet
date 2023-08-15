import React, { useCallback, useMemo, useState } from "react"
import { View, Pressable, Text, Image } from "react-native";
import { useEngine } from "../../engine/Engine";
import { ProductBanner } from "./ProductBanner";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { holdersUrl } from "../../engine/holders/HoldersProduct";
import { HoldersCardItem } from "./HoldersCardItem";
import BN from "bn.js";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";

import Hide from '../../../assets/ic-hide.svg';
import Show from '../../../assets/ic-show.svg';

export const holdersCardImageMap: { [key: string]: any } = {
    'classic': require('../../../assets/classic.png'),
    'black-pro': require('../../../assets/black-pro.png'),
    'whales': require('../../../assets/whales.png'),
}

export const HoldersProductButton = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const accounts = engine.products.holders.useCards();
    const hiddenCards = engine.products.holders.useHiddenCards();
    const visibleList = useMemo(() => {
        return accounts.filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);
    const hiddenList = useMemo(() => {
        return accounts.filter((item) => {
            return hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    const staking = engine.products.whalesStakingPools.useStakingCurrent();
    const status = engine.products.holders.useStatus();
    const [collapsed, setCollapsed] = useState(true);

    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    const needsEnrolment = useMemo(() => {
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.products.keys.getDomainKey(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    const onPress = useCallback(
        () => {
            if (needsEnrolment) {
                navigation.navigate(
                    'HoldersLanding',
                    {
                        endpoint: holdersUrl,
                        onEnrollType: { type: 'account' }
                    }
                );
                return;
            }
            navigation.navigateHolders({ type: 'account' });
        },
        [needsEnrolment],
    );

    if (!AppConfig.isTestnet) {
        return null;
    }

    if (accounts.length === 0) {
        if (staking.total.gt(new BN(0))) {
            return null;
        }
        return (
            <ProductBanner
                title={t('products.zenPay.card.defaultTitle')}
                subtitle={t('products.zenPay.card.defaultSubtitle')}
                onPress={onPress}
                illustration={require('../../../assets/banner-holders.png')}
            />
        );
    }


    if (visibleList.length === 1) {
        return (
            <>
                <View style={{
                    borderRadius: 20,
                    backgroundColor: Theme.lightGrey,
                    marginHorizontal: 16
                }}>
                    <HoldersCardItem
                        key={`card-${visibleList[0].id}`}
                        account={visibleList[0]}
                        last={true}
                    />
                </View>
                {hiddenList.length > 0 && (
                    <>
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
                                {t('products.zenPay.hiddenCards')}
                            </Text>
                            <Pressable
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1
                                    }
                                }}
                                onPress={() => setCollapsed(!collapsed)}
                            >
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '500',
                                    lineHeight: 20,
                                    color: Theme.accent,
                                }}>
                                    {collapsed ? 'Show' : 'Hide'}
                                </Text>
                            </Pressable>
                        </View>
                        <AnimatedChildrenCollapsible
                            showDivider={false}
                            collapsed={collapsed}
                            items={hiddenList}
                            renderItem={(item, index) => {
                                return (
                                    <HoldersCardItem
                                        key={`card-${index}`}
                                        account={item}
                                        first={index === 0}
                                        last={index === hiddenList.length - 1}
                                        rightAction={() => engine.products.holders.showCard(item.id)}
                                        rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                                    />
                                )
                            }}
                        />
                    </>
                )}
            </>
        );
    }

    return (
        <View style={{}}>
            {visibleList.map((item, index) => {
                return (
                    <HoldersCardItem
                        key={`card-${index}`}
                        account={item}
                        first={index === 0}
                        last={index === visibleList.length - 1}
                        rightAction={() => engine.products.holders.hideCard(item.id)}
                        rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                    />
                )
            })}
            {hiddenList.length > 0 && (
                <>
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
                            {t('products.zenPay.hiddenCards')}
                        </Text>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => setCollapsed(!collapsed)}
                        >
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '500',
                                lineHeight: 20,
                                color: Theme.accent,
                            }}>
                                {collapsed ? 'Show' : 'Hide'}
                            </Text>
                        </Pressable>
                    </View>
                    <AnimatedChildrenCollapsible
                        showDivider={false}
                        collapsed={collapsed}
                        items={hiddenList}
                        renderItem={(item, index) => {
                            return (
                                <HoldersCardItem
                                    key={`card-${index}`}
                                    account={item}
                                    first={index === 0}
                                    last={index === hiddenList.length - 1}
                                    rightAction={() => engine.products.holders.showCard(item.id)}
                                    rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                                />
                            )
                        }}
                    />
                </>
            )}
        </View>
    );
})