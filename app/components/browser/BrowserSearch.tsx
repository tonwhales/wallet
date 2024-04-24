import { memo, useCallback, useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { ATextInput } from "../ATextInput";
import { t } from "../../i18n/t";
import { extractDomain } from "../../engine/utils/extractDomain";
import { Typography } from "../styles";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { isUrl } from "../../utils/resolveUrl";
import axios from "axios";
import { useToaster } from "../toast/ToastProvider";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

function normalizeUrl(url: string) {
    if (!url) {
        return null;
    }

    let normalizedURL = url.trim().toLocaleLowerCase();

    if (!isUrl(normalizedURL)) {
        normalizedURL = `https://${url}`;
    }

    if (!isUrl(normalizedURL)) {
        return null;
    }

    return normalizedURL;
}

async function checkUrlReachability(url: string) {
    try {
        const response = await axios.head(url);
        return true;
    } catch (error) {
        return false;
    }
};


export const BrowserSearch = memo(({ theme, navigation }: { theme: ThemeType, navigation: TypedNavigation }) => {
    const [search, setSearch] = useState('');
    const toaster = useToaster();
    const bottomBarHeight = useBottomTabBarHeight();

    const onSearch = useCallback(async (text: string) => {
        const url = normalizeUrl(text);

        if (!url) {
            toaster.show({ type: 'error', message: t('browser.search.invalidUrl'), marginBottom: Platform.select({ ios: bottomBarHeight + 16, android: 16 }) });
            return;
        }

        if (!await checkUrlReachability(url)) {
            toaster.show({ type: 'error', message: t('browser.search.urlNotReachable'), marginBottom: Platform.select({ ios: bottomBarHeight + 16, android: 16 }) });
            return;
        }

        const domain = extractDomain(url);

        const titleComponent = (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 8 }}>
                    <View style={{
                        width: 24, height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.accent,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                            {domain.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                        {domain}
                    </Text>
                </View>
            </View>
        );

        navigation.navigateDAppWebView({
            url,
            header: { titleComponent: titleComponent },
            useStatusBar: true,
            engine: 'ton-connect',
            refId: 'tonhub-search',
            controlls: {
                refresh: true,
                share: true,
                back: true,
                forward: true
            }
        });
    }, []);

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            marginHorizontal: 16,
            borderRadius: 20,
            backgroundColor: theme.border,
            borderBottomWidth: 1,
            borderBottomColor: theme.border
        }}>
            <Ionicons name={'search'} size={24} color={theme.iconNav} />
            <ATextInput
                index={0}
                style={{
                    marginHorizontal: 16,
                    flex: 1
                }}
                onValueChange={(text) => {
                    setSearch(text.toLowerCase());
                }}
                onSubmit={() => {
                    console.log('onSubmit', search);
                    onSearch(search);
                }}
                keyboardType={'web-search'}
                inpoutMode={'url'}
                textContentType={'URL'}
                placeholder={t('browser.search.placeholder')}
                returnKeyType={'go'}
                value={search}
            />
        </View>
    );
});