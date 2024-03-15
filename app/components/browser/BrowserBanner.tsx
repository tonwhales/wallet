import { memo } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { ScaledSize, View } from "react-native";
import FastImage from "react-native-fast-image";

export const BrowserBanner = memo(({
    banner,
    dimensions
}: {
    banner: BrowserBannerItem,
    dimensions: {
        window: ScaledSize;
        screen: ScaledSize;
    }
}) => {
    const width = dimensions.screen.width - 32;
    console.log('BrowserBanner', banner.title);
    return (
        <View style={{ width, height: width / 2, backgroundColor: 'red' }}>
            <FastImage
                source={{ uri: banner.image_url || undefined }}
                style={{ width, height: width / 2 }}
                resizeMode={FastImage.resizeMode.cover}
            />
        </View>
    );
})