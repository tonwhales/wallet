import { t } from "i18next";
import React, { useLayoutEffect } from "react";
import { Alert, LayoutAnimation, View } from "react-native";
import { WImage } from "../../components/WImage";
import { Engine } from "../../engine/Engine";
import { extractDomain } from "../../engine/utils/extractDomain";
import { avatarHash } from "../../utils/avatarHash";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { CardProductButton, gradientColorsMap } from "./CardProductButton";

export const ExtensionsProductButton = React.memo(({ engine, itemWidth }: { engine: Engine, itemWidth: number }) => {
    const extensions = engine.products.extensions.useExtensions();
    const navigation = useTypedNavigation();

    const removeExtension = React.useCallback((key: string) => {
        Alert.alert(t('auth.apps.delete.title'), t('auth.apps.delete.message'), [{ text: t('common.cancel') }, {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(key);
            }
        }]);
    }, []);

    const openExtension = React.useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = engine.persistence.domainKeys.getValue(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [extensions]);

    if (extensions.length === 1) {
        const e = extensions[0];
        const colorsIndex = avatarHash(e.key, gradientColorsMap.length);
        return (
            <CardProductButton
                key={`app-` + e.key}
                title={e.name}
                description={e.description ?? undefined}
                width={itemWidth}
                height={itemWidth}
                style={{ marginBottom: 14 }}
                gradientColors={gradientColorsMap[colorsIndex]}
                descriptionTextProps={{ numberOfLines: 3 }}
                icon={
                    <WImage
                        src={e.image?.url}
                        blurhash={e.image?.url}
                        width={42}
                        heigh={42}
                        borderRadius={8}
                    />
                }
                onPress={() => openExtension(e.url)}
                onLongPress={() => removeExtension(e.key)}
            />
        );
    }

    return (
        <>
            <CardProductButton
                key={`extensions`}
                title={`${t('products.services')} (${extensions.length})`}
                description={t('products.servicesDescription')}
                width={itemWidth}
                height={itemWidth}
                style={{ marginBottom: 14 }}
                gradientColors={gradientColorsMap[2]}
                descriptionTextProps={{ numberOfLines: 3 }}
                icon={
                    <View style={{ flexDirection: 'row' }}>
                        {extensions.slice(0, 3).map((e, i) => {
                            return (
                                <WImage
                                    key={e.key}
                                    src={e.image?.url}
                                    blurhash={e.image?.blurhash}
                                    width={42}
                                    heigh={42}
                                    borderRadius={8}
                                    style={{
                                        marginLeft: -16
                                    }}
                                />
                            );
                        })}

                    </View>
                }
            // onPress={() => openExtension(e.url)}
            // onLongPress={() => removeExtension(e.key)}
            />
        </>
    );
})