import { memo, useCallback, useState } from "react";
import { ImageSourcePropType, Text, Image, View, ScrollView } from "react-native";
import { useTheme } from "../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openWithInApp } from "../utils/openWithInApp";
import { CheckBox } from "./CheckBox";
import { Typography } from "./styles";
import { t } from "../i18n/t";
import { RoundButton } from "./RoundButton";
import { sharedStoragePersistence } from "../storage/storage";

export const ConfirmLegal = memo(({
    onConfirmed,
    skipKey,
    title,
    description,
    termsAndPrivacy,
    privacyUrl,
    termsUrl,
    dontShowTitle,
    icon,
}: {
    onConfirmed: () => void,
    skipKey: string,
    title: string,
    description: string,
    termsAndPrivacy: string
    privacyUrl: string,
    termsUrl: string,
    dontShowTitle: string,
    icon?: ImageSourcePropType,
}) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);
    const [doNotShow, setDoNotShow] = useState(sharedStoragePersistence.getBoolean(skipKey));

    const onDoNotShowToggle = useCallback((newVal: boolean) => { setDoNotShow(newVal) }, []);
    const openTerms = useCallback(() => {
        if (!!termsUrl) {
            openWithInApp(termsUrl);
        }
    }, [termsUrl]);
    const openPrivacy = useCallback(() => {
        if (privacyUrl) {
            openWithInApp(privacyUrl);
        }
    }, [privacyUrl]);

    const onOpen = useCallback(() => {
        if (accepted) {
            sharedStoragePersistence.set(skipKey, doNotShow || false);
            onConfirmed();
        }
    }, [accepted, doNotShow, skipKey]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ flexGrow: 1 }} />
                    {!!icon && (
                        <Image
                            style={{
                                width: 100,
                                height: 100,
                                overflow: 'hidden'
                            }}
                            source={icon}
                        />
                    )}
                    <Text style={[{
                        textAlign: 'center',
                        color: theme.textPrimary,
                        marginTop: 16,
                        marginHorizontal: 24
                    }, Typography.semiBold24_30]}>
                        {title}
                    </Text>
                    <Text style={[
                        { marginVertical: 24, color: theme.textSecondary, textAlign: 'center' },
                        Typography.regular15_20
                    ]}
                    >
                        {description}
                    </Text>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{
                        paddingRight: 62,
                        marginBottom: 24,
                        width: '100%'
                    }}>
                        <CheckBox
                            checked={accepted}
                            onToggle={(newVal) => setAccepted(newVal)}
                            text={
                                <Text style={{ color: theme.textSecondary }}>
                                    {termsAndPrivacy}
                                    <Text
                                        style={{ color: theme.accent }}
                                        onPress={openTerms}
                                    >
                                        {t('legal.termsOfService')}
                                    </Text>
                                    {' ' + t('common.and') + ' '}
                                    <Text
                                        style={{ color: theme.accent }}
                                        onPress={openPrivacy}
                                    >
                                        {t('legal.privacyPolicy')}
                                    </Text>
                                </Text>
                            }
                        />
                        <CheckBox
                            checked={doNotShow}
                            onToggle={onDoNotShowToggle}
                            text={
                                <Text style={[{ marginLeft: 16, color: theme.textSecondary }, Typography.regular15_20]}>
                                    {dontShowTitle}
                                </Text>
                            }
                            style={{ marginTop: 16 }}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ height: 64, marginTop: 16, marginBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom, alignSelf: 'stretch', paddingHorizontal: 16 }}>
                <RoundButton
                    disabled={!accepted}
                    title={t('common.continue')}
                    onPress={onOpen}
                />
            </View>
        </View>
    );
});