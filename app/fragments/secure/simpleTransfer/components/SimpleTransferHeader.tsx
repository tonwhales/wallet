import { memo, ReactNode } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../../../utils/useTypedNavigation';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { useTheme } from '../../../../engine/hooks';
import { StatusBar } from 'expo-status-bar';

type Props = {
    onBackPressed?: () => void,
    title?: string,
    titleComponent?: ReactNode,
}

export const SimpleTransferHeader = memo(({
    title,
    onBackPressed,
    titleComponent,
}: Props) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    
    return (
        <>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                title={title}
                onBackPressed={onBackPressed}
                titleComponent={titleComponent}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
        </>
    )
})