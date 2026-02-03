import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ImageSourcePropType, Text, Image, View, ScrollView, Platform } from "react-native";
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
    iconSvg,
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
    iconSvg?: React.ReactNode,
}) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const [accepted, setAccepted] = useState(false);
    const [doNotShow, setDoNotShow] = useState(sharedStoragePersistence.getBoolean(skipKey));

    useEffect(() => {
        if (Platform.OS === 'ios') {
            const timer = setTimeout(() => {
                scrollRef.current?.flashScrollIndicators();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []);

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

    const buttonAreaHeight = 64 + 16 + (safeArea.bottom === 0 ? 32 : safeArea.bottom);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: buttonAreaHeight
                }}
                showsVerticalScrollIndicator={true}
            >
                <View style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <View style={{ flexGrow: 1, minHeight: 12 }} />
                    {iconSvg || (!!icon && (
                        <Image
                            style={{
                                width: 100,
                                height: 100,
                                overflow: 'hidden'
                            }}
                            source={icon}
                        />
                    ))}
                    <Text style={[{
                        textAlign: 'center',
                        color: theme.textPrimary,
                        marginTop: 16,
                        marginHorizontal: 16
                    }, Typography.semiBold24_30]}>
                        {title}
                    </Text>
                    <Text style={[
                        { marginVertical: 16, color: theme.textSecondary, textAlign: 'center' },
                        Typography.regular13_18
                    ]}
                    >
                        {description}
                    </Text>
                    <View style={{ flexGrow: 1, minHeight: 12 }} />
                    <View style={{
                        marginBottom: 16,
                        width: '100%',
                        paddingRight: 16
                    }}>
                        <CheckBox
                            checked={accepted}
                            onToggle={(newVal) => setAccepted(newVal)}
                            text={
                                <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                    {termsAndPrivacy}
                                    <Text
                                        style={[{ color: theme.accent }, Typography.regular13_18]}
                                        onPress={openTerms}
                                    >
                                        {t('legal.termsOfService')}
                                    </Text>
                                    {' ' + t('common.and') + ' '}
                                    <Text
                                        style={[{ color: theme.accent }, Typography.regular13_18]}
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
                                <Text style={[{ marginLeft: 16, color: theme.textSecondary }, Typography.regular13_18]}>
                                    {dontShowTitle}
                                </Text>
                            }
                            style={{ marginTop: 16 }}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 64,
                marginTop: 16,
                marginBottom: safeArea.bottom === 0
                    ? 32
                    : safeArea.bottom,
                paddingHorizontal: 16
            }}>
                <RoundButton
                    disabled={!accepted}
                    title={t('common.continue')}
                    onPress={onOpen}
                />
            </View>
        </View>
    );
});