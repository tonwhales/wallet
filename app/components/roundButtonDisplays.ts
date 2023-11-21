import { ThemeType } from "../engine/state/theme";

export type RoundButtonDisplay =
    | 'default'
    | 'outline'
    | 'inverted'
    | 'pro'
    | 'telegram'
    | 'text'
    | 'secondary'
    | 'secondary_contrast'
    | 'disabled'
    | 'danger_zone'
    | 'danger_zone_text';

export function roundButtonDisplays(theme: ThemeType): { [key in RoundButtonDisplay]: {
    textColor: string,
    backgroundColor: string,
    borderColor: string,
} } {
    return {
        default: {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
            textColor: theme.textUnchangeable,
        },
        disabled: {
            backgroundColor: theme.accentDisabled,
            borderColor: theme.accentDisabled,
            textColor: theme.textUnchangeable,
        },
        secondary: {
            backgroundColor: theme.surfaceOnElevation,
            borderColor: theme.surfaceOnElevation,
            textColor: theme.textThird,
        },
        secondary_contrast: {
            backgroundColor: theme.surfaceOnElevation,
            borderColor: theme.surfaceOnElevation,
            textColor: theme.textPrimary,
        },
        pro: {
            backgroundColor: theme.textPrimary,
            borderColor: theme.textPrimary,
            textColor: theme.surfaceOnBg,
        },
        telegram: {
            backgroundColor: theme.telegram,
            borderColor: theme.telegram,
            textColor: theme.surfaceOnBg,
        },
        outline: {
            backgroundColor: theme.backgroundPrimary,
            borderColor: theme.accent,
            textColor: theme.accent,
        },
        inverted: {
            backgroundColor: theme.surfaceOnBg,
            borderColor: theme.surfaceOnBg,
            textColor: theme.accent,
        },
        text: {
            backgroundColor: theme.transparent,
            borderColor: theme.transparent,
            textColor: theme.accent,
        },
        danger_zone_text: {
            backgroundColor: theme.transparent,
            borderColor: theme.transparent,
            textColor: theme.accentRed,
        },
        danger_zone: {
            backgroundColor: theme.surfaceOnBg,
            borderColor: theme.surfaceOnBg,
            textColor: theme.accentRed,
        },
    }
}