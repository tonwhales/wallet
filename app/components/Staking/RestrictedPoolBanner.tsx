import React, { useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { AppConfig } from "../../AppConfig";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { openWithInApp } from "../../utils/openWithInApp";
import { WImage } from "../WImage";

export const RestrictedPoolBanner = React.memo(({ type }: { type: 'club' | 'team' }) => {
    const onLearMore = useCallback(
        () => {
            if (type === 'club') {
                openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club');
                return;
            }
            openWithInApp('https://whalescorp.notion.site/TonWhales-job-offers-235c45dc85af44718b28e79fb334eff1');
        },
        [type],
    );


    return (
        <View style={{
            alignItems: 'center', borderRadius: 16, borderColor: Theme.accent, borderWidth: 1,
            marginHorizontal: 16, padding: 16
        }}>
            <WImage
                requireSource={require('../../../assets/ic_pool_banner.png')}
                width={64}
                heigh={64}
                borderRadius={32}
            />
            <Text style={{
                fontSize: 16,
                textAlignVertical: 'center',
                color: Theme.textColor,
                marginTop: 20,
                fontWeight: '600',
                flexGrow: 1,
                flexBasis: 0
            }}>
                {type === 'club' && t('products.staking.pools.clubBanner')}
                {type === 'team' && t('products.staking.pools.teamBanner')}
            </Text>
            <Text style={{
                fontSize: 14,
                textAlign: 'center',
                color: Theme.textSecondary,
                fontWeight: '500',
                marginTop: 12,
                flexGrow: 1,
                flexBasis: 0
            }}>
                {type === 'club' && t('products.staking.pools.clubBannerDescription')}
                {type === 'team' && t('products.staking.pools.teamBannerDescription')}
            </Text>
            <Pressable
                style={({ pressed }) => {
                    return ({
                        backgroundColor: Theme.secondaryButton,
                        margin: 24,
                        paddingHorizontal: 16,
                        paddingVertical: 11,
                        opacity: pressed ? .3 : 1,
                        borderRadius: 8
                    });
                }}
                onPress={onLearMore}
            >
                <Text style={{
                    fontSize: 14,
                    textAlign: 'center',
                    color: Theme.textColor,
                    fontWeight: '600',
                }}>
                    {type === 'club' && t('products.staking.pools.clubBannerLearnMore')}
                    {type === 'team' && t('products.staking.pools.teamBannerLearnMore')}
                </Text>
            </Pressable>
        </View>
    );
});