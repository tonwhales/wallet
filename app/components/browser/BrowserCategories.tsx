import { memo, useMemo } from "react";
import { ListingsCategory } from "./BrowserListings";
import { Platform, View } from "react-native";
import { BrowserCategory } from "./BrowserCategory";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export const BrowserCategories = memo(({ list }: { list: Map<string, ListingsCategory> }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const bottomBarHeight = useBottomTabBarHeight();

    const categories = useMemo(() => {
        return Array.from(list.values()).sort((a, b) => b.weight - a.weight);
    }, [list]);

    return (
        <View style={Platform.select({ android: { paddingBottom: bottomBarHeight + 56 + 16 } })}>
            {categories.map((category, index) => (
                <View
                    style={{ marginBottom: 16 }}
                    key={`${category.id}-${index}`}
                >
                    <BrowserCategory
                        navigation={navigation}
                        theme={theme}
                        category={category}
                    />
                </View>
            ))}
        </View>
    );
});