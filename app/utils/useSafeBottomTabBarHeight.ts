import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useContext } from 'react';

// Like useBottomTabBarHeight, but returns 0 outside of a bottom tab navigator instead of throwing
export function useSafeBottomTabBarHeight(): number {
    return useContext(BottomTabBarHeightContext) ?? 0;
}
