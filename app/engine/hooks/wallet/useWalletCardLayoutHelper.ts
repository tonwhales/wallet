import { Platform } from "react-native";
import { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useWalletCardLayoutHelper = () => {
        const safeArea = useSafeAreaInsets();
    
        const scrollOffsetSv = useSharedValue(0)
        const scrollHandler = useAnimatedScrollHandler((event) => {
            scrollOffsetSv.value = event.contentOffset.y;
        });

        // We use static sizes for correct header-gradient animation
        const selectedWalletHeight = 48
        const topPadding = safeArea.top + (Platform.OS === 'ios' ? 0 : 16)
        const walletHeaderHeight = selectedWalletHeight + topPadding
        const walletCardHeight = 146 + walletHeaderHeight

        return {
            walletHeaderHeight,
            walletCardHeight,
            scrollOffsetSv,
            scrollHandler
        }
}