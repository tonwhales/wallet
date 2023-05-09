import { ThemeType } from "../utils/AppConfigContext";

export type RoundButtonDisplay = 'default' | 'outline' | 'inverted' | 'pro' | 'telegram' | 'text' | 'secondary' | 'secondary_contrast' | 'disabled' | 'danger_zone';

export function roundButtonDisplays(theme: ThemeType): { [key in RoundButtonDisplay]: {
    textColor: string,
    textPressed: string,
    backgroundColor: string,
    backgroundPressedColor: string,
    borderColor: string,
    borderPressedColor: string
} } {
    return {
        default: {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
            textColor: theme.item,

            backgroundPressedColor: theme.accentDark,
            borderPressedColor: theme.accentDark,
            textPressed: theme.item,
        },
        disabled: {
            backgroundColor: theme.disabled,
            borderColor: theme.disabled,
            textColor: theme.item,

            backgroundPressedColor: theme.accentDark,
            borderPressedColor: theme.accentDark,
            textPressed: theme.item,
        },
        secondary: {
            backgroundColor: theme.secondaryButton,
            borderColor: theme.secondaryButton,
            textColor: theme.secondaryButtonText,

            backgroundPressedColor: theme.selector,
            borderPressedColor: theme.selector,
            textPressed: theme.secondaryButtonText,
        },
        secondary_contrast: {
            backgroundColor: theme.secondaryButton,
            borderColor: theme.secondaryButton,
            textColor: theme.textColor,

            backgroundPressedColor: theme.selector,
            borderPressedColor: theme.selector,
            textPressed: theme.secondaryButtonText,
        },
        pro: {
            backgroundColor: theme.textColor,
            borderColor: theme.textColor,
            textColor: theme.item,

            backgroundPressedColor: theme.pressedRoundButton,
            borderPressedColor: theme.pressedRoundButton,
            textPressed: theme.item,
        },
        telegram: {
            backgroundColor: theme.telegram,
            borderColor: theme.telegram,
            textColor: theme.item,

            backgroundPressedColor: theme.pressedRoundButton,
            borderPressedColor: theme.pressedRoundButton,
            textPressed: theme.item,
        },
        outline: {
            backgroundColor: theme.background,
            borderColor: theme.accent,
            textColor: theme.accent,

            backgroundPressedColor: theme.accentDark,
            borderPressedColor: theme.accentDark,
            textPressed: theme.accent,
        },
        inverted: {
            backgroundColor: theme.item,
            borderColor: theme.item,
            textColor: theme.accent,

            backgroundPressedColor: theme.divider,
            borderPressedColor: theme.divider,
            textPressed: theme.accent,
        },
        text: {
            backgroundColor: theme.transparent,
            borderColor: theme.transparent,
            textColor: theme.accentText,

            backgroundPressedColor: theme.divider,
            borderPressedColor: theme.divider,
            textPressed: theme.accent,
        },
        danger_zone: {
            backgroundColor: theme.item,
            borderColor: theme.item,
            textColor: theme.dangerZone,

            backgroundPressedColor: theme.divider,
            borderPressedColor: theme.divider,
            textPressed: theme.accent,
        },
    }
}