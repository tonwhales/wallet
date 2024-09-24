import { memo, useMemo } from "react";
import { FlatList } from "react-native-gesture-handler";
import { View, Text, Platform, Dimensions, StyleSheet } from "react-native";

import { BrowserListingItem, ListingsCategory } from "./BrowserListings";
import { BrowserListItem } from "./BrowserListItem";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../styles";

const SCREEN_WIDTH = Dimensions.get('window').width;
const MIN_COMMON_SCREEN_WIDTH = 402

interface BrowserCategoryProps {
    category: ListingsCategory,
    navigation: TypedNavigation,
    theme: ThemeType
}

interface ColumnItemProps {
    index: number
    columns: BrowserListingItem[]
    navigation: TypedNavigation
    theme: ThemeType
}

export const BrowserCategory = memo((props: BrowserCategoryProps) => {
    const { category, navigation, theme } = props

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

    const snapToInterval = useMemo(() => {
        if (SCREEN_WIDTH <= MIN_COMMON_SCREEN_WIDTH) {
            return SCREEN_WIDTH - 64
        }
        return SCREEN_WIDTH - 44
    }, [])


    return (
        <View style={styles.container}>
            <Text style={[
                { color: theme.textPrimary },
                styles.title,
                Typography.semiBold20_28
            ]}>
                {category.title}
            </Text>
            {category.description && (
                <Text style={[
                    { color: theme.textSecondary },
                    styles.description,
                    Typography.regular15_20
                ]}>
                    {category.description}
                </Text>
            )}
            <FlatList
                data={columns}
                keyExtractor={(_, index) => `col-${index}`}
                horizontal
                scrollEnabled={columns.length > 1}
                showsHorizontalScrollIndicator={false}
                snapToInterval={snapToInterval}
                decelerationRate={'fast'}
                overScrollMode={'never'}
                renderItem={({ item, index }) =>
                    <ColumnItem
                        index={index}
                        columns={item}
                        navigation={navigation}
                        theme={theme}
                    />
                }
            />
        </View>
    );
});



const ColumnItem = memo((props: ColumnItemProps) => {
    const { index, theme, columns, navigation } = props

    return <View
        key={`category-col-${index}`}
        style={[
            styles.box,
            Platform.select({ android: { marginRight: index === columns.length - 1 ? 32 : 16 } }),
        ]}
    >
        {columns.map((item: any, index: number) => (
            <View
                key={`category-item-${index}`}
                style={[
                    styles.columnContainer,
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
})

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    title: { marginHorizontal: 16 },
    description: { marginHorizontal: 16, marginBottom: 16 },
    box: {
        paddingHorizontal: 8,
        width: SCREEN_WIDTH - 42,
    },
    columnContainer: { marginBottom: 24, width: '100%', }
})
