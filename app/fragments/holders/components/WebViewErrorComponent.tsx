import { memo, useEffect, useState } from "react";
import { View, Text, Platform, Pressable } from "react-native";
import { t } from "../../../i18n/t";
import { useAppConfig } from "../../../utils/AppConfigContext";
import * as Network from 'expo-network';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { RoundButton } from "../../../components/RoundButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";

export const WebViewErrorComponent = memo(({
    errorDomain,
    errorCode,
    errorDesc,
    onReload
}: {
    errorDomain?: string,
    errorCode: number,
    errorDesc: string,
    onReload: () => void
}) => {
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();
    const [networkState, setNetworkState] = useState<Network.NetworkState | undefined>();


    useEffect(() => {
        (async () => {
            const netState = await Network.getNetworkStateAsync();
            setNetworkState(netState);
        })();
    }, []);


    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16
        }}>
            {!!networkState ? (
                <View style={{ width: '100%' }}>
                    <Text style={{
                        fontSize: 32, lineHeight: 40,
                        color: Theme.textColor,
                        fontWeight: '600',
                        marginBottom: 4
                    }}>
                        {t('common.somethingWentWrong')}
                    </Text>
                    <Text style={{
                        color: Theme.textSecondary,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                        marginBottom: 8
                    }}>
                        {networkState.isInternetReachable ?
                            t('common.errorOccurred', { error: errorDesc, code: errorCode }) :
                            t('common.checkInternetConnection')
                        }
                    </Text>
                    <Text style={{
                        color: Theme.textSecondary,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                        marginBottom: 16
                    }}>
                        {t('webView.contactSupportOrTryToReload')}
                    </Text>

                    <RoundButton
                        display={'default'}
                        onPress={onReload}
                        title={t('common.reload')}
                    />
                </View>
            )
                : (
                    <Animated.View
                        style={{
                            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                            justifyContent: 'center', alignItems: 'center',
                        }}
                        entering={FadeIn}
                        exiting={FadeOut}
                    >
                        <LoadingIndicator simple />
                    </Animated.View>
                )
            }
            {Platform.OS === 'ios' && (
                <Pressable
                    style={{ position: 'absolute', top: 22, right: 16 }}
                    onPress={() => {
                        navigation.goBack();
                    }} >
                    <Text style={{ color: Theme.accent, fontWeight: '500', fontSize: 17 }}>
                        {t('common.close')}
                    </Text>
                </Pressable>
            )}
        </View>
    );
})