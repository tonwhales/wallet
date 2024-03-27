import { memo, useMemo } from "react";
import { ListingsCategory } from "./BrowserListings";
import { View, Text, Platform } from "react-native";
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
        const sorted = category.listings.sort((a, b) => {
            const wA = a.weight ?? 0;
            const wB = b.weight ?? 0;
            if (wA < wB) return -1;
            if (wA > wB) return 1;
            return 0;
        });
        // dividing category.listings into columns of 3 items
        const columns = [];
        let column = [];
        for (let i = 0; i < sorted.length; i++) {
            column.push(sorted[i]);
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
        <View style={{ marginBottom: 16 }}>
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
                scrollEnabled={columns.length > 1}
                style={{ maxHeight: (56 + 24) * 3, width: '100%' }}
                showsHorizontalScrollIndicator={false}
                snapToInterval={dimensions.screen.width - 16}
                decelerationRate={'fast'}
                contentInset={{ left: 32, right: 32 }}
                overScrollMode={'never'}
                renderItem={({ item, index }) => (
                    <View
                        key={`category-col-${index}`}
                        style={[
                            {
                                width: columns.length > 1 ? dimensions.screen.width - 64 : dimensions.screen.width,
                                marginRight: 16
                            },
                            Platform.select({ android: { marginRight: index === columns.length - 1 ? 32 : 16 } })
                        ]}
                    >
                        {item.map((item, index) => (
                            <View
                                key={`category-item-${index}`}
                                style={[
                                    { marginLeft: 16, marginBottom: 24, width: '100%' },
                                    Platform.select({ android: { marginRight: index === 0 ? 16 : 0 } })
                                ]}
                            >
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