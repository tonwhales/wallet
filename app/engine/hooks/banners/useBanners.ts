import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchBanners } from "../../api/fetchBanners";
import i18n from 'i18next';
import * as Application from 'expo-application';
import { Platform } from "react-native";
import { useHiddenBanners } from "./useHiddenBanners";

export function useBanners() {
    const hiddenBanners = useHiddenBanners();
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

            const fetched = await fetchBanners({ version, buildNumber, platform, language });

            if (!fetched) {
                return null;
            }

            if (!!fetched.product) {
                // TODO same check for banners as for product
                if (hiddenBanners.includes(fetched.product.id)) {
                    fetched.product = null;
                }
            }

            return fetched;
        },
    });
}