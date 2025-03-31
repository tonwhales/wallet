import { memo, useMemo } from "react";
import { Image } from "expo-image";
import { GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { ThemeType } from "../../engine/state/theme";
import { PerfView } from "../basic/PerfView";
import { PerfText } from "../basic/PerfText";
import { useLockAppWithAuthState } from "../../engine/hooks/settings";
import { ImageStyle, StyleProp, TextStyle, View, ViewStyle } from "react-native";

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

export const HoldersAccountCard = memo(({ card, theme, style, coverImageStyle, cardNumberStyle }: {
    card: GeneralHoldersCard,
    theme: ThemeType,
    style?: StyleProp<ViewStyle>,
    coverImageStyle?: StyleProp<ImageStyle>,
    cardNumberStyle?: StyleProp<TextStyle>
}) => {
    const [lockAppWithAuth] = useLockAppWithAuthState();
    // TODO: remove this when we have the correct personalization codes
    let imageType: 'holders' | 'classic' | 'whales' | 'black-pro' = 'black-pro';

    if (card.provider === 'elysphere-kauri') {
        imageType = 'classic';
    }

    const paymentSchema = useMemo(() => {
        if (card.schema === 'visa') {
            return <Image source={require('@assets/visa.png')} style={{ width: 23, height: 12, marginRight: 8 }} />
        } else if (card.schema === 'mc') {
            return <Image source={require('@assets/mastercard.png')} style={{ width: 16, height: 10, marginRight: 8 }} />
        }
        return null
    }, [card.schema]);

    return (
        <PerfView style={[{ width: 46, height: 30, borderRadius: 6 }, style]}>
            <Image source={cardImages[theme.style === 'dark' ? 'dark' : 'light'][imageType]} style={[{ width: 46, height: 30 }, coverImageStyle]} />
            <View style={{ position: 'absolute', left: 0, bottom: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
                {!!card.lastFourDigits && (
                    <PerfText style={[{ marginLeft: 8, marginBottom: 8, fontSize: 10, lineHeight: 10, fontWeight: '500', color: theme.textUnchangeable }, cardNumberStyle]}>
                        {lockAppWithAuth ? card.lastFourDigits : '****'}
                    </PerfText>
                )}
                {paymentSchema}
            </View>
        </PerfView>
    );
});
HoldersAccountCard.displayName = 'HoldersAccountCard';