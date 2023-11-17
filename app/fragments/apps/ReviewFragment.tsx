import { useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform } from "react-native";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ReportComponent } from "./components/review/ReportComponent";
import { ReviewComponent } from "./components/review/ReviewComponent";
import { ScreenHeader } from "../../components/ScreenHeader";

export const ReviewFragment = fragment(() => {
    const params = (useRoute().params) as { url: string, type: 'review' | 'report' };
    const navigation = useTypedNavigation();

    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader onClosePressed={navigation.goBack} />
            {params.type === 'report' && (
                <ReportComponent url={params.url} />
            )}
            {params.type === 'review' && (
                <ReviewComponent url={params.url} />
            )}
        </>
    );
});