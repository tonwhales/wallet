import { Dispatch, SetStateAction, memo, useCallback } from "react";
import { Pressable, Image, Text, View } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { KnownPools } from "../../utils/KnownPools";
import { useNetwork, useStakingActive, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { BackButton } from "../navigation/BackButton";
import { Typography } from "../styles";
import { extractDomain } from "../../engine/utils/extractDomain";

export const StakingPoolHeader = memo(({
    isLedger,
    currentPool,
    setParams,
}: {
    isLedger: boolean;
    currentPool: Address;
    setParams: Dispatch<SetStateAction<{
        backToHome?: boolean | undefined;
        pool: string;
    }>>
}) => {
    const safeArea = useSafeAreaInsets();
    const active = useStakingActive() || {};
    const activeLength = Object.keys(active).length;
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();

    const currentPoolFriendly = currentPool.toString({ testOnly: network.isTestnet });

    const openPoolSelector = useCallback(() => {
        if (activeLength < 2) {
            return;
        }
        navigation.navigate(
            isLedger ? 'StakingPoolSelectorLedger' : 'StakingPoolSelector',
            {
                current: currentPool,
                callback: (pool: Address) => {
                    setParams((prev) => ({ ...prev, pool: pool.toString({ testOnly: network.isTestnet }) }));
                }
            },
        )
    }, [isLedger, currentPool, setParams, activeLength]);

    const openMoreInfo = () => {
        const url = KnownPools(network.isTestnet)[currentPoolFriendly]?.webLink;

        if (!!url) {
            const domain = extractDomain(url);
            navigation.navigateDAppWebViewModal({
                lockNativeBack: true,
                safeMode: true,
                url,
                header: { title: { type: 'params', params: { domain } } },
                useStatusBar: true,
                engine: 'ton-connect',
                controlls: {
                    refresh: true,
                    share: true,
                    back: true,
                    forward: true
                }
            });
        }
    };

    return (
        <View
            style={{
                backgroundColor: theme.backgroundUnchangeable,
                paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                paddingHorizontal: 16
            }}
            collapsable={false}
        >
            <View style={{
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6
            }}>
                <View style={{ flex: 1 }}>
                    <BackButton
                        iconTintColor={theme.iconUnchangeable}
                        style={{ backgroundColor: theme.surfaceOnDark }}
                        onPress={navigation.goBack}
                    />
                </View>
                <Pressable
                    style={({ pressed }) => ({
                        flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: '30%',
                        opacity: (pressed && activeLength >= 2) ? 0.5 : 1
                    })}
                    onPress={openPoolSelector}
                >
                    <Text style={[{
                        color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary,
                    }, Typography.semiBold17_24]}>
                        {KnownPools(network.isTestnet)[currentPoolFriendly]?.name}
                    </Text>
                </Pressable>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                            height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                            borderRadius: 16
                        })}
                        onPress={openMoreInfo}
                    >
                        <Image
                            source={require('@assets/ic-info.png')}
                            style={{
                                height: 16,
                                width: 16,
                                tintColor: theme.iconUnchangeable
                            }}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});