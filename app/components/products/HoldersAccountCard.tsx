import { memo } from "react";
import { Image } from "expo-image";
import { GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { ThemeType } from "../../engine/state/theme";
import { PerfView } from "../basic/PerfView";
import { PerfText } from "../basic/PerfText";
import { useLockAppWithAuthState } from "../../engine/hooks/settings";

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
    const [lockAppWithAuth] = useLockAppWithAuthState();
    // TODO: remove this when we have the correct personalization codes
    let imageType: 'holders' | 'classic' | 'whales' | 'black-pro' = 'black-pro';

    if (card.provider === 'elysphere-kauri') {
        imageType = 'classic';
    }

    return (
        <PerfView style={{ width: 46, height: 30, borderRadius: 6 }}>
            <Image source={cardImages[theme.style === 'dark' ? 'dark' : 'light'][imageType]} style={{ width: 46, height: 30 }} />
            {!!card.lastFourDigits && (
                <PerfText style={{ position: 'absolute', left: 4, bottom: 3.5, fontSize: 7.5, fontWeight: '500', color: theme.textUnchangeable }}>
                    {lockAppWithAuth ? card.lastFourDigits : '****'}
                </PerfText>
            )}
        </PerfView>
    );
});
HoldersAccountCard.displayName = 'HoldersAccountCard';