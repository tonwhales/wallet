import { memo, useCallback } from "react";
import { BrowserListingItem } from "./BrowserListings";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { ThemeType } from "../../engine/state/theme";
import { View } from "react-native";
import { ProductButton } from "../../fragments/wallet/products/ProductButton";
import { useDimensions } from "@react-native-community/hooks";

export const BrowserListItem = memo(({
    item,
    navigation,
    theme
}: {
    item: BrowserListingItem,
    navigation: TypedNavigation,
    theme: ThemeType
}) => {
    const dimensions = useDimensions();
    const onPress = useCallback(() => {
        navigation.navigateDAppWebView({
            url: item.product_url,
            title: item.title ?? undefined,
            header: {
                title: item.title ?? ''
            },
            useStatusBar: true,
            //     useMainButton?: boolean;
            //     useQueryAPI?: boolean;
            //     useToaster?: boolean;
            refId: `browser-banner-${item.id}`
        })
    }, [item]);

    return (
        <View style={{
            height: 56,
            width: dimensions.screen.width - 32,
        }}>
            <ProductButton
                name={item.title ?? ''}
                subtitle={item.description ?? ''}
                image={item.image_url ?? undefined}
                value={null}
                onPress={onPress}
                style={{ marginHorizontal: 0 }}
            />
        </View>
    );
});