import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchBanners } from "../../api/fetchBanners";
import i18n from 'i18next';
import * as Application from 'expo-application';
import { Platform } from "react-native";

export function useBanners() {
    return useQuery({
        queryKey: Queries.Banners(i18n.language),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: async () => {
            const language = i18n.language;
            const version = Application.nativeApplicationVersion ?? '1.0.0';
            const buildNumber = Application.nativeBuildVersion ?? '1';
            const platform = Platform.OS === 'ios' ? 'ios' : 'android';
            return await fetchBanners({
                platform,
                language,
                version,
                buildNumber,
            })
        },
    });
}