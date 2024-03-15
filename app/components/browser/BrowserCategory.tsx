import { memo, useMemo } from "react";
import { ListingsCategory } from "./BrowserListings";
import { View, Text } from "react-native";
import { BrowserListItem } from "./BrowserListItem";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../styles";
import { FlatList } from "react-native-gesture-handler";
import { useDimensions } from "@react-native-community/hooks";

export const BrowserCategory = memo(({
    category,
    navigation,
    theme
}: {
    category: ListingsCategory,
    navigation: TypedNavigation,
    theme: ThemeType
}) => {
    const dimensions = useDimensions();
    const columns = useMemo(() => {
        // deviding category.listings into columns of 3 items
        const columns = [];
        let column = [];
        for (let i = 0; i < category.listings.length; i++) {
            column.push(category.listings[i]);
            if (column.length === 3) {
                columns.push(column);
                column = [];
            }
        }
        if (column.length > 0) {
            columns.push(column);
        }
        return columns;
    }, [category.listings]);

    return (
        <View>
            <Text style={[
                { color: theme.textPrimary, marginHorizontal: 16 },
                Typography.semiBold20_28
            ]}>
                {category.title}
            </Text>
            {category.description && (
                <Text style={[
                    { color: theme.textSecondary, marginHorizontal: 16, marginBottom: 16 },
                    Typography.regular15_20
                ]}>
                    {category.description}
                </Text>
            )}
            <FlatList
                data={columns}
                keyExtractor={(item, index) => `col-${index}`}
                horizontal
                style={{ maxHeight: (56 + 16) * 3, marginBottom: 16 }}
                showsHorizontalScrollIndicator={false}
                snapToInterval={dimensions.screen.width + 32}
                decelerationRate={'fast'}
                contentInset={{
                    left: 32,
                    right: 32,
                }}
                renderItem={({ item }) => (
                    <View style={{ backgroundColor: 'red' }}>
                        {item.map((item, index) => (
                            <View style={{ paddingBottom: 16, marginLeft: 16 }}>
                                <BrowserListItem
                                    key={index}
                                    item={item}
                                    navigation={navigation}
                                    theme={theme}
                                />
                            </View>
                        ))}
                    </View>
                )}
            />
        </View>
    );
});