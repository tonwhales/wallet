import { ThemeType } from "../utils/AppConfigContext";

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
            textColor: theme.textThird,
        },
        disabled: {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
            textColor: theme.textThird,
        },
        secondary: {
            backgroundColor: theme.border,
            borderColor: theme.border,
            textColor: theme.accent,
        },
        secondary_contrast: {
            backgroundColor: theme.surfaceSecondary,
            borderColor: theme.surfaceSecondary,
            textColor: theme.textPrimary,
        },
        pro: {
            backgroundColor: theme.textPrimary,
            borderColor: theme.textPrimary,
            textColor: theme.surfacePimary,
        },
        telegram: {
            backgroundColor: theme.telegram,
            borderColor: theme.telegram,
            textColor: theme.surfacePimary,
        },
        outline: {
            backgroundColor: theme.background,
            borderColor: theme.accent,
            textColor: theme.accent,
        },
        inverted: {
            backgroundColor: theme.surfacePimary,
            borderColor: theme.surfacePimary,
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
            backgroundColor: theme.surfacePimary,
            borderColor: theme.surfacePimary,
            textColor: theme.accentRed,
        },
    }
}