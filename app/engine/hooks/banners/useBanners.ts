import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchBanners } from "../../api/fetchBanners";
import i18n from 'i18next';
import * as Application from 'expo-application';
import { Platform } from "react-native";
import { useHiddenBanners } from "./useHiddenBanners";

export function useBanners() {
    const hiddenBanners = useHiddenBanners();

    const language = i18n.language;
    const version = Application.nativeApplicationVersion ?? '1.0.0';
    const buildNumber = Application.nativeBuildVersion ?? '1';

    const query = useQuery({
        queryKey: Queries.Banners(language, version, buildNumber),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: async () => {
            const platform = Platform.OS === 'ios' ? 'ios' : 'android';
            return await fetchBanners({ version, buildNumber, platform, language });
        },
    });

    const data = query.data;

    if (!data) {
        return null;
    }

    if (!!data.product) {
        // TODO same check for banners as for product
        if (hiddenBanners.includes(data.product.id)) {
            data.product = null;
        }
    }

    return data;
}