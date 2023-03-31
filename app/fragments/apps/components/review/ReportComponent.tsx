import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react"
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../../../AppConfig";
import { ATextInput } from "../../../../components/ATextInput";
import { RoundButton } from "../../../../components/RoundButton";
import { postExtensionReport } from "../../../../engine/api/reviews";
import { useEngine } from "../../../../engine/Engine";
import { t } from "../../../../i18n/t";
import { getCurrentAddress } from "../../../../storage/appState";
import { Theme } from "../../../../Theme";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { Picker } from '@react-native-picker/picker';

export const ReportComponent = React.memo(({ url }: { url: string }) => {
    const engine = useEngine();
    const appData = engine.products.extensions.useAppData(url);
    const safeArea = useSafeAreaInsets();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const navigation = useTypedNavigation();
    const [sending, setSending] = useState(false);
    const [type, setType] = useState<'scam' | 'spam' | 'bug' | 'offense'>('bug');
    const [report, setReport] = useState<string>('');

    const onSend = useCallback(
        async () => {
            setSending(true);
            try {
                await postExtensionReport(url, {
                    type,
                    address: address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    comment: {
                        text: report,
                        images: []
                    }
                });

                Alert.alert(t('report.posted'), undefined, [{
                    onPress: () => {
                        navigation.goBack();
                    }
                }]);

            } catch (error) {
                Alert.alert(t('report.error'));
            }
            setSending(false);
        },
        [address, type, report],
    );

    return (
        <>
            <ScrollView
                style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                alwaysBounceVertical={false}
            >
                <Text
                    style={{
                        fontSize: 24,
                        marginHorizontal: 16,
                        textAlign: 'center',
                        color: Theme.textColor,
                        fontWeight: '600',
                        marginTop: 10
                    }}
                >
                    {appData?.title}
                </Text>
                <View style={{
                    marginBottom: 16, marginTop: 16,
                    marginHorizontal: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ATextInput
                        value={report}
                        onValueChange={setReport}
                        keyboardType="default"
                        autoCapitalize="sentences"
                        style={{ backgroundColor: Theme.transparent, paddingHorizontal: 0, marginHorizontal: 16 }}
                        preventDefaultHeight
                        multiline
                        label={
                            <View style={{
                                flexDirection: 'row',
                                width: '100%',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                overflow: 'hidden',
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: Theme.label,
                                    alignSelf: 'flex-start',
                                }}>
                                    {t('report.message')}
                                </Text>
                            </View>
                        }
                    />
                </View>
                <View style={{
                    marginBottom: 16, marginTop: 2,
                    marginHorizontal: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        paddingHorizontal: 16,
                        paddingTop: 10
                    }}>
                        <Text style={{
                            fontWeight: '500',
                            fontSize: 12,
                            color: Theme.label,
                            alignSelf: 'flex-start',
                        }}>
                            {t('report.reason')}
                        </Text>
                    </View>
                    <Picker
                        style={{
                            width: '80%'
                        }}
                        itemStyle={{
                            fontSize: 17
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
            </ScrollView>
            <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                <RoundButton title={t('common.send')} onPress={onSend} disabled={report.length === 0} loading={sending} />
            </View>
        </>
    );
});