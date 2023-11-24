import React from "react";
import { useRoute } from "@react-navigation/native";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ReportComponent } from "./components/review/ReportComponent";
import { ReviewComponent } from "./components/review/ReviewComponent";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../engine/hooks";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ReviewFragment = fragment(() => {
    const theme = useTheme();
    const params = (useRoute().params) as { url: string, type: 'review' | 'report' };
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    return (
        <>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark' })} />
            <ScreenHeader onClosePressed={navigation.goBack} style={Platform.select({ android: { paddingTop: safeArea.top } })} />
            {params.type === 'report' && (
                <ReportComponent url={params.url} />
            )}
            {params.type === 'review' && (
                <ReviewComponent url={params.url} />
            )}
        </>
    );
});