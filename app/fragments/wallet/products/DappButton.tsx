import { memo, useCallback, useMemo } from "react";
import { AnimatedProductButton } from "./AnimatedProductButton";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useAppData } from "../../../engine/hooks/dapps/useAppData";
import { useAppManifest } from "../../../engine/hooks/dapps/useAppManifest";
import { AppInfo } from "../../../components/ConnectedAppButton";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getDomainKey } from "../../../engine/effects/dapps/getDomainKey";

export const DappButton = memo(({ key, url, name, tonconnect }: { key: string, name?: string | null, url: string, tonconnect?: boolean }) => {
    const navigation = useTypedNavigation();
    const appData = useAppData(url);
    const appManifest = useAppManifest(url);

    const app: AppInfo = useMemo(() => {
        if (appData) {
            return { ...appData, type: 'app-data' };
        } else if (appManifest && tonconnect) {
            return { ...appManifest, type: 'app-manifest' };
        } else {
            return null;
        }
    }, [appData, appManifest, tonconnect]);

    const title = useMemo(() => {
        if (!app) {
            return name;
        }
        if (app.type === 'app-data') {
            return app.title;
        } else {
            return app.name;
        }
    }, [app, name]);

    const subtitle = useMemo(() => {
        if (!app) {
            return extractDomain(url);
        }
        if (app.type === 'app-data') {
            return app.description ?? extractDomain(app.url);
        } else {
            return extractDomain(app.url);
        }
    }, [app, url]);

    const image = useMemo(() => {
        if (appData?.image) {
            return appData.image.preview256;
        } else if (appManifest?.iconUrl) {
            return appManifest.iconUrl;
        }
    }, [appData, appManifest]);

    const onPress = useCallback(() => {
        let domain = extractDomain(url);

        if (!domain) {
            return; // Shouldn't happen
        }

        if (tonconnect) {
            navigation.navigate('ConnectApp', { url });
            return;
        }

        const key = getDomainKey(domain);
        if (!key) {
            navigation.navigate('Install', { url });
            return;
        }

        navigation.navigate('App', { url });
    }, [url, tonconnect]);

    return (
        <AnimatedProductButton
            entering={FadeInUp}
            exiting={FadeOutDown}
            key={key}
            name={title ?? 'Unknown'}
            subtitle={subtitle}
            image={image}
            value={null}
            onPress={onPress}
            extension={true}
            style={{ marginVertical: 4 }}
        />
    );
});