import React, { memo, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { t } from "../i18n/t";
import { WImage } from "./WImage";
import { useTheme } from '../engine/hooks';
import { AppData } from '../engine/api/fetchAppData';
import { AppManifest } from '../engine/api/fetchManifest';
import { useAppData } from '../engine/hooks';
import { useAppManifest } from '../engine/hooks';
import { extractDomain } from '../engine/utils/extractDomain';
import { useConnectExtensions } from "../engine/hooks/dapps/useTonConnectExtenstions";
import { extensionKey } from "../engine/hooks/dapps/useAddExtension";

export type AppInfo = (AppData & { type: 'app-data' }) | (AppManifest & { type: 'app-manifest' }) | null;

export const ConnectedAppButton = memo(({
    name,
    url,
    tonconnect,
    onRevoke
}: {
    name?: string | null,
    url: string,
    tonconnect?: boolean,
    onRevoke?: () => void,
}) => {
    const theme = useTheme();
    const appData = useAppData(url);
    const [inastalledConnectApps,] = useConnectExtensions();
    const appKey = extensionKey(url)
    const manifestUrl = useMemo(() => {
        return inastalledConnectApps?.[appKey]?.manifestUrl;
    }, [inastalledConnectApps, appKey]);
    const appManifest = useAppManifest(manifestUrl ?? '');
    const app: AppInfo = useMemo(() => {
        if (appData) {
            return { ...appData, type: 'app-data' };
        } else if (appManifest && tonconnect) {
            return { ...appManifest, type: 'app-manifest' };
        } else {
            return null;
        }
    }, [appData, appManifest, tonconnect, name]);

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


    return (
        <View style={{
            height: 62, borderRadius: 14,
            backgroundColor: theme.surfaceOnElevation, flexDirection: 'row',
            alignItems: 'center',
            padding: 10
        }}>
            <WImage
                heigh={42}
                width={42}
                src={app?.type === 'app-data' ? app?.image?.preview256 : app?.iconUrl}
                blurhash={app?.type === 'app-data' ? app?.image?.blurhash : undefined}
                style={{ marginRight: 10 }}
                borderRadius={8}
            />
            <View
                style={{
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'center',
                    height: 42
                }}
            >
                {!!title && (
                    <Text style={{
                        fontSize: 16,
                        color: theme.textPrimary,
                        fontWeight: '600',
                        flex: 1,
                        marginBottom: 3
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {title}
                    </Text>
                )}
                {!!url && (
                    <Text style={{
                        fontSize: 16,
                        color: theme.textSecondary,
                        fontWeight: '400',
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {extractDomain(url)}
                    </Text>
                )}
            </View>
            <Pressable
                style={({ pressed }) => {
                    return {
                        marginLeft: 10,
                        opacity: pressed ? 0.3 : 1,
                        height: 42,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                }}
                onPress={onRevoke}
            >
                <Text
                    style={{
                        fontWeight: '500',
                        color: theme.accentRed,
                        fontSize: 16
                    }}
                >
                    {t('common.delete')}
                </Text>
            </Pressable>
        </View>
    );
})