import { useRoute } from "@react-navigation/native";
import React from "react"
import { View, Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";

export const ReportComponent = React.memo(({ url }: { url: string }) => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View>
            <Text>
                {url}
            </Text>
        </View>
    );
});