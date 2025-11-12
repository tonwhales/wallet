import { memo } from "react";
import { View } from "react-native";
import { StickerElement } from "../../../engine/ai/markup-types";
import LottieView from 'lottie-react-native';

export const SupportedStickers = {
    whales_hello: require('@assets/animations/whales_hello.json'),
    whales_cry: require('@assets/animations/whales_cry.json'),
    whales_dead: require('@assets/animations/whales_dead.json'),
    whales_dunno: require('@assets/animations/whales_dunno.json'),
    whales_good: require('@assets/animations/whales_good.json'),
    whales_kiss: require('@assets/animations/whales_kiss.json'),
    whales_loading: require('@assets/animations/whales_loading.json'),
    whales_lol: require('@assets/animations/whales_lol.json'),
    whales_mad: require('@assets/animations/whales_mad.json'),
    whales_money: require('@assets/animations/whales_money.json'),
    whales_not_bad: require('@assets/animations/whales_not_bad.json'),
    whales_rude: require('@assets/animations/whales_rude.json'),
    whales_stake: require('@assets/animations/whales_stake.json')
};

export const MessageSticker = memo(({ element }: { element: StickerElement }) => {
    const { name, loop = 'true', autoplay = 'true' } = element.attributes;

    const getStickerSource = (stickerName: string) => {
        if (Object.keys(SupportedStickers).includes(stickerName)) {
            return SupportedStickers[stickerName as keyof typeof SupportedStickers];
        }
        return null;
    };

    const source = getStickerSource(name);

    if (!source) {
        return null;
    }

    return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <LottieView
                source={source}
                autoPlay={autoplay === 'true'}
                loop={loop === 'true'}
                style={{
                    width: 120,
                    height: 120,
                }}
            />
        </View>
    );
});

