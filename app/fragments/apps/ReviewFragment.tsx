import { useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ReportComponent } from "./components/review/ReportComponent";
import { ReviewComponent } from "./components/review/ReviewComponent";

export const ReviewFragment = fragment(() => {
    const params = (useRoute().params) as {
        url: string,
        type: 'review' | 'report'
    };
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ marginTop: safeArea.top }} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {params.type === 'report' ? t('report.title') : t('review.title')}
                    </Text>
                </View>
            )}
            {params.type === 'report' && (
                <ReportComponent url={params.url} />
            )}
            {params.type === 'review' && (
                <ReviewComponent url={params.url} />
            )}
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </>
    );
});