import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Like useBottomTabBarHeight, but usable outside a bottom tab navigator: instead of
// throwing it falls back to the bottom safe-area inset so content still clears the home indicator
export function useSafeBottomTabBarHeight(): number {
    const tabBarHeight = useContext(BottomTabBarHeightContext);
    const safeArea = useSafeAreaInsets();
    return tabBarHeight ?? safeArea.bottom;
}
