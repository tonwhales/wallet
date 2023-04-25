import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { AppData } from "../engine/api/fetchAppData";
import { useEngine } from "../engine/Engine";
import { AppManifest } from "../engine/api/fetchManifest";
import { extractDomain } from "../engine/utils/extractDomain";
import { t } from "../i18n/t";
import { WImage } from "./WImage";
import { useAppConfig } from "../utils/AppConfigContext";

type AppInfo = (AppData & { type: 'app-data' }) | (AppManifest & { type: 'app-manifest' }) | null;

export const ConnectedAppButton = React.memo((
    {
        name,
        url,
        tonconnect,
        onRevoke
    }: {
        name: string,
        url: string,
        tonconnect?: boolean,
        onRevoke?: () => void,
    }
) => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const appData = engine.products.extensions.useAppData(url);
    const appManifest = engine.products.tonConnect.useAppManifest(url);
    let app: AppInfo = useMemo(() => {
        if (appData) {
            return { ...appData, type: 'app-data' };
        } else if (appManifest && tonconnect) {
            return { ...appManifest, type: 'app-manifest' };
        } else {
            return null;
        }
    }, [appData, appManifest, tonconnect]);

    return (
        <View style={{
            height: 62, borderRadius: 14,
            backgroundColor: Theme.item, flexDirection: 'row',
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
                {!!name && (
                    <Text style={{
                        fontSize: 16,
                        color: Theme.textColor,
                        fontWeight: '600',
                        flex: 1,
                        marginBottom: 3
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {name}
                    </Text>
                )}
                {!!url && (
                    <Text style={{
                        fontSize: 16,
                        color: Theme.price,
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
                        color: Theme.delete,
                        fontSize: 16
                    }}
                >
                    {t('common.delete')}
                </Text>
            </Pressable>
        </View>
    );
})