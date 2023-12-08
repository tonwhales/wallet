import { memo } from "react";
import { View, Image, Text } from "react-native";
import { GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { ThemeType } from "../../engine/state/theme";

const cardImages = {
    'dark': {
        'classic': require('@assets/card-violet-dark.png'),
        'whales': require('@assets/card-whales-dark.png'),
        'black-pro': require('@assets/card-black-dark.png'),
        'holders': require('@assets/card-holders-dark.png')
    },
    'light': {
        'classic': require('@assets/card-violet-light.png'),
        'whales': require('@assets/card-whales-light.png'),
        'black-pro': require('@assets/card-black-light.png'),
        'holders': require('@assets/card-holders-light.png')
    }
}

export const HoldersAccountCard = memo(({ card, theme }: { card: GeneralHoldersCard, theme: ThemeType }) => {
    let imageType: 'holders' | 'classic' | 'whales' | 'black-pro' = 'classic'
    if (card.personalizationCode !== 'trust-classic' && card.personalizationCode !== 'trust-pro') {
        imageType = card.personalizationCode
    }

    return (
        <View style={{ width: 46, height: 30, borderRadius: 6 }}>
            <Image source={cardImages[theme.style === 'dark' ? 'dark' : 'light'][imageType]} style={{ width: 46, height: 30 }} />
            {!!card.lastFourDigits && (
                <Text style={{ position: 'absolute', left: 4, bottom: 3.5, fontSize: 7.5, fontWeight: '500', color: theme.textUnchangeable }}>
                    {card.lastFourDigits}
                </Text>
            )}
        </View>
    );
});