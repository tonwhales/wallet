import { ActionSheetOptions } from "@expo/react-native-action-sheet";
import { ThemeType } from "../state/theme";
import { Dimensions, Insets } from "react-native";

export const getAndroidActionSheetOptions = (theme: ThemeType, inset: Insets): Partial<ActionSheetOptions> => {
    return {
        tintColor: theme.textPrimary,
        cancelButtonTintColor: theme.textPrimary,
        containerStyle: {
            backgroundColor: theme.elevation,
            paddingBottom: inset.bottom,
        },
        textStyle: {
            color: theme.textPrimary,
            width: Dimensions.get('window').width,
            height: '100%',
            marginHorizontal: -16,
            paddingHorizontal: 16,
            backgroundColor: theme.elevation,
        },
        titleTextStyle: {
            color: theme.textPrimary,
        },
        messageTextStyle: {
            color: theme.textSecondary,
        },
    }
}