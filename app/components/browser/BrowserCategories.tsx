import { memo, useMemo } from "react";
import { ListingsCategory } from "./BrowserListings";
import { View } from "react-native";
import { BrowserCategory } from "./BrowserCategory";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";

export const BrowserCategories = memo(({ list }: { list: Map<string, ListingsCategory> }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    const categories = useMemo(() => {
        return Array.from(list.values()).sort((a, b) => b.weight - a.weight);
    }, [list]);

    return (
        <View>
            {categories.map((category, index) => (
                <BrowserCategory
                    key={index}
                    navigation={navigation}
                    theme={theme}
                    category={category}
                />
            ))}
        </View>
    );
});