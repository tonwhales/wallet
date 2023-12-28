import React, { memo, useCallback, useMemo, useState } from "react"
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../../../components/ATextInput";
import { RoundButton } from "../../../../components/RoundButton";
import { postExtensionReport } from "../../../../engine/api/reviews";
import { t } from "../../../../i18n/t";
import { getCurrentAddress } from "../../../../storage/appState";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../../../engine/hooks';
import { useAppData } from '../../../../engine/hooks';
import { useNetwork } from "../../../../engine/hooks/network/useNetwork";
import { WImage } from "../../../../components/WImage";

export const ReportComponent = memo(({ url }: { url: string }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const appData = useAppData(url);
    const safeArea = useSafeAreaInsets();
    const address = useMemo(() => getCurrentAddress().address, []);
    const navigation = useTypedNavigation();

    const [type, setType] = useState<'scam' | 'spam' | 'bug' | 'offense'>('bug');
    const [report, setReport] = useState<string>('');

    const onSend = useCallback(async () => {
        try {
            await postExtensionReport(url, {
                type,
                address: address.toString({ testOnly: isTestnet }),
                comment: {
                    text: report,
                    images: []
                }
            });
            navigation.navigateAlert({ title: t('report.posted'), message: t('review.postedDescription') }, true)
        } catch (error) {
            Alert.alert(t('report.error'));
        }
    }, [address, type, report]);

    return (
        <>
            <ScrollView
                style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                alwaysBounceVertical={false}
            >
                <View style={{ alignItems: 'center' }}>
                    <WImage
                        heigh={72}
                        width={72}
                        src={appData?.image?.preview256}
                        blurhash={appData?.image?.preview256}
                        style={{ marginRight: 10 }}
                        borderRadius={16}
                    />
                    <Text
                        style={{
                            fontSize: 24,
                            marginHorizontal: 16,
                            textAlign: 'center',
                            color: theme.textPrimary,
                            fontWeight: '600',
                            marginTop: 16,
                            marginVertical: 24
                        }}
                    >
                        {appData?.title}
                    </Text>
                    <View style={{ width: '100%' }}>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginHorizontal: 16,
                            paddingVertical: 20,
                            borderRadius: 20,
                            marginTop: 5
                        }}>
                            <ATextInput
                                value={report}
                                onValueChange={setReport}
                                keyboardType="default"
                                autoCapitalize="sentences"
                                style={{ paddingHorizontal: 16 }}
                                multiline
                                label={t('report.message')}
                            />
                        </View>
                    </View>
                    <View style={{ width: '100%' }}>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginHorizontal: 16,
                            paddingVertical: 20, paddingHorizontal: 20,
                            borderRadius: 20,
                            marginTop: 16
                        }}>
                            <Text style={{
                                color: theme.textSecondary,
                                fontSize: 17,
                                fontWeight: '400',
                                alignSelf: 'flex-start',
                            }}>
                                {t('report.reason')}
                            </Text>
                            <Picker
                                itemStyle={{
                                    fontSize: 17,
                                    color: theme.textSecondary
                                }}
                                mode={'dropdown'}
                                selectedValue={type}
                                onValueChange={(itemValue, itemIndex) => {
                                    setType(itemValue);
                                }}>
                                <Picker.Item label={t('report.spam')} value={'spam'} />
                                <Picker.Item label={t('report.scam')} value={'scam'} />
                                <Picker.Item label={t('report.bug')} value={'bug'} />
                                <Picker.Item label={t('report.offense')} value={'offense'} />
                            </Picker>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                keyboardVerticalOffset={16}
            >
                <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                    <RoundButton title={t('common.send')} action={onSend} disabled={report.length === 0} />
                </View>
            </KeyboardAvoidingView>
        </>
    );
});