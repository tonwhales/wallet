import React, { useCallback, useState } from "react"
import { View, Text, ScrollView, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../../../components/ATextInput";
import { RoundButton } from "../../../../components/RoundButton";
import { postExtensionReport } from "../../../../engine/api/reviews";
import { t } from "../../../../i18n/t";
import { getCurrentAddress } from "../../../../storage/appState";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../../../engine/hooks/theme/useTheme';
import { useAppData } from '../../../../engine/hooks/dapps/useAppData';
import { useNetwork } from "../../../../engine/hooks/network/useNetwork";

export const ReportComponent = React.memo(({ url }: { url: string }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const appData = useAppData(url);
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
                    address: address.toString({ testOnly: isTestnet }),
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
                        color: theme.textColor,
                        fontWeight: '600',
                        marginTop: 10
                    }}
                >
                    {appData?.title}
                </Text>
                <View style={{
                    marginBottom: 16, marginTop: 16,
                    marginHorizontal: 16,
                    backgroundColor: theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ATextInput
                        value={report}
                        onValueChange={setReport}
                        keyboardType="default"
                        autoCapitalize="sentences"
                        style={{ backgroundColor: theme.transparent, paddingHorizontal: 0, marginHorizontal: 16 }}
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
                                    color: theme.label,
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
                    backgroundColor: theme.item,
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
                            color: theme.label,
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