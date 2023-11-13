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
import { useTheme } from "../../engine/hooks";
import { ScreenHeader } from "../../components/ScreenHeader";

export const ReviewFragment = fragment(() => {
    const params = (useRoute().params) as {
        url: string,
        type: 'review' | 'report'
    };
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
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