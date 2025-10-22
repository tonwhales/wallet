import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, Text, View, Image, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useTheme } from '../../engine/hooks';
import { isTermsAccepted, markAsTermsAccepted, markAsTermsNotAccepted } from '../../storage/terms';
import { mnemonicNew } from "@ton/crypto";
import { ScreenHeader } from "../../components/ScreenHeader";

import IcCheck from "@assets/ic-check.svg";
import { useParams } from "../../utils/useParams";

export const LegalFragment = systemFragment(() => {
    const theme = useTheme();
    const dimensions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const { ledger } = useParams<{ ledger?: boolean }>();
    const isCreate = route.name === 'LegalCreate';

    const [state, setState] = useState<{ mnemonics: string } | null>(null);
    const [accepted, setAccepted] = useState(isTermsAccepted() ? true : false);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);

    const onContinue = useCallback(() => {
        if (isCreate) {
            setLoading(true);
            if (state) {
                navigation.replace('WalletCreate', { mnemonics: state.mnemonics, ledger });
                return;
            }
            setReady(true);
            return;
        }
        navigation.replace('WalletImport');
    }, [state]);

    const onToggleAccept = useCallback(() => {
        setAccepted(!accepted);
        if (accepted) {
            markAsTermsNotAccepted();
        } else {
            markAsTermsAccepted();
        }
    }, [accepted]);

    useEffect(() => {
        if (!isCreate) {
            return;
        }
        (async () => {
            const mnemonics = await mnemonicNew();
            setState({ mnemonics: mnemonics.join(' ') });
        })()
    }, []);

    useEffect(() => {
        if (ready && state) {
            navigation.replace('WalletCreate', { mnemonics: state.mnemonics, ledger });
            return;
        }
    }, [accepted, state]);

    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: theme.backgroundPrimary,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 16,
        }}>
            <ScreenHeader
                style={[{ paddingLeft: 16 }, Platform.select({ ios: { paddingTop: 16 } })]}
                onBackPressed={navigation.goBack}
            />
            <ScrollView style={{ width: '100%', height: dimensions.height - (Platform.OS === 'android' ? safeArea.top : 32) - 224 }}>
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={{
                        fontSize: 32, lineHeight: 38,
                        fontWeight: '600',
                        textAlign: 'center',
                        color: theme.textPrimary,
                        marginBottom: 12, marginTop: 16
                    }}>
                        {isCreate ? t('legal.create') : t('legal.title')}
                    </Text>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 17,
                            fontWeight: '400',
                            flexShrink: 1,
                            color: theme.textSecondary,
                            marginBottom: 24
                        }}
                    >
                        {t('legal.createSubtitle')}
                    </Text>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        aspectRatio: 0.92,
                        width: dimensions.width - 32,
                    }}>
                        <Image
                            resizeMode={'contain'}
                            style={{ width: dimensions.width - 32 }}
                            source={theme.style === 'dark' ? require('@assets/banner_backup_dark.webp') : require('@assets/banner_backup.webp')}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ flexGrow: 1 }} />
            <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24, marginTop: 8 }}
                onPress={onToggleAccept}
            >
                <View style={{
                    height: 24, width: 24,
                    backgroundColor: accepted ? theme.accent : theme.divider,
                    borderRadius: 6,
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: 16
                }}>
                    {accepted && (<IcCheck color={theme.white} />)}
                </View>
                <Text
                    style={{
                        flexShrink: 1,
                        fontSize: 15,
                        fontWeight: '500',
                        textAlign: 'left'
                    }}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                >
                    <Text style={{
                        color: theme.textSecondary,
                    }}>
                        {t('legal.subtitle')}
                    </Text>
                    <Text
                        style={{ color: theme.accent }}
                        onPress={() => navigation.navigate('Privacy')}>
                        {' ' + t('legal.privacyPolicy')}
                    </Text>
                    <Text style={{ color: theme.textSecondary, }}>
                        {' ' + t('common.and') + ' '}
                    </Text>
                    <Text style={{ color: theme.accent }}
                        onPress={() => navigation.navigate('Terms')}>
                        {t('legal.termsOfService')}
                    </Text>
                </Text>
            </Pressable>
            <View style={[{ paddingHorizontal: 16, width: '100%' }, Platform.select({ android: { paddingBottom: 16 } })]}>
                <RoundButton
                    disabled={!accepted}
                    loading={loading}
                    title={t('common.continue')}
                    onPress={onContinue}
                />
            </View>
        </View>
    );
});