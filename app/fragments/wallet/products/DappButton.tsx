import { memo, useCallback, useMemo } from "react";
import { AnimatedProductButton } from "./AnimatedProductButton";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useAppData } from "../../../engine/hooks/dapps/useAppData";
import { AppInfo } from "../../../components/ConnectedAppButton";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Alert } from "react-native";
import { t } from "../../../i18n/t";
import { useRemoveExtension } from "../../../engine/effects/dapps/useRemoveExtension";
import { useDomainKey } from "../../../engine/hooks/dapps/useDomainKey";

export const DappButton = memo(({
    appKey,
    url,
    name,
    tonconnect
}: {
        appKey: string,
        name?: string | null,
        url: string,
        tonconnect?: boolean
    }
) => {
    const navigation = useTypedNavigation();
    const appData = useAppData(url);
    const domain = extractDomain(url);
    const domainKey = useDomainKey(domain);

    // const removeConnectApp = useRemoveConnectApp();
    const removeExtension = useRemoveExtension();

    const app: AppInfo = useMemo(() => {
        if (!tonconnect) {
            return appData ? { ...appData, type: 'app-data' } : null;
        } else {
            return null;
        }
    }, [appData, tonconnect]);

    const title = useMemo(() => {
        if (!app) {
            return name;
        }
        if (app.type === 'app-data') {
            return app.title;
        } else {
            return '';
        }
    }, [app, name]);

    const subtitle = useMemo(() => {
        if (!app) {
            return extractDomain(url);
        }
        if (app.type === 'app-data') {
            return app.description ?? extractDomain(app.url);
        } else {
            return '';
        }
    }, [app, url]);

    const image = useMemo(() => {
        if (appData?.image) {
            return appData.image.preview256;
        }
    }, [appData]);

    const onPress = useCallback(() => {
        if (!domain) {
            return; // Shouldn't happen
        }

        if (tonconnect) {
            navigation.navigate('ConnectApp', { url });
            return;
        }

        if (!domainKey) {
            navigation.navigate('Install', { url });
            return;
        }

        navigation.navigate('App', { url });
    }, [url, tonconnect, domainKey, app]);

    let onRemoveExtension = useCallback((key: string) => {
        Alert.alert(t('auth.apps.delete.title'), t('auth.apps.delete.message'), [{ text: t('common.cancel') }, {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
                if (!tonconnect) {
                    removeExtension(key);
                    return
                }
                if (app) {
                    // TODO
                    // removeConnectApp(app.url);
                }
            }
        }]);
    }, [tonconnect, app]);

    return (
        <AnimatedProductButton
            entering={FadeInUp}
            exiting={FadeOutDown}
            name={title ?? 'Unknown'}
            subtitle={subtitle}
            image={image}
            value={null}
            onLongPress={() => onRemoveExtension(appKey)}
            onPress={onPress}
            extension={true}
            style={{ marginVertical: 4 }}
        />
    );
});