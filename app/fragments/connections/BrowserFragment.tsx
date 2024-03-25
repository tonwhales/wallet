import * as React from 'react';
import { useCallback } from 'react';
import { Pressable, View, Image } from 'react-native';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { resolveUrl } from '../../utils/resolveUrl';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useLinkNavigator } from '../../useLinkNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { TabHeader } from '../../components/topbar/TabHeader';
import { useNetwork, useTheme } from '../../engine/hooks';
import { setStatusBarStyle } from 'expo-status-bar';
import { BrowserTabs } from '../../components/browser/BrowserTabs';

export const BrowserFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const linkNavigator = useLinkNavigator(network.isTestnet);

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch {
            // Ignore
        }
    };

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    }, [theme.style]));

    return (
        <View style={{ flex: 1 }}>
            <TabHeader
                title={t('home.browser')}
                rightAction={
                    <Pressable
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.surfaceOnBg,
                            height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                            borderRadius: 16
                        })}
                        onPress={openScanner}
                    >
                        <Image
                            source={require('@assets/ic-scan-main.png')}
                            style={{
                                height: 22,
                                width: 22,
                                tintColor: theme.iconNav
                            }}
                        />
                    </Pressable>
                }
                style={{ marginBottom: 8 }}
            />
            <BrowserTabs />
        </View>
    );
});