import React from "react";
import { View, Text, Pressable } from "react-native";
import { useEngine } from "../engine/Engine";
import { extractDomain } from "../engine/utils/extractDomain";
import { AppIcon } from "../fragments/apps/components/AppIcon";
import { t } from "../i18n/t";
import { Theme } from "../Theme";

export const ConnectedAppButton = React.memo((
    {
        name,
        url,
        onRevoke
    }: {
        name: string,
        url: string,
        onRevoke?: () => void
    }
) => {
    const engine = useEngine();
    const app = engine.products.extensions.useAppData(url);

    return (
        <View style={{
            height: 62, borderRadius: 14,
            backgroundColor: 'white', flexDirection: 'row',
            alignItems: 'center',
            padding: 10
        }}>
            <AppIcon
                heigh={42}
                width={42}
                app={app}
                style={{ marginRight: 10 }}
                borderRadius={10}
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
                        color: '#787F83',
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
                        color: '#CF3535',
                        fontSize: 16
                    }}
                >
                    {t('common.delete')}
                </Text>
            </Pressable>
        </View>
    );
})