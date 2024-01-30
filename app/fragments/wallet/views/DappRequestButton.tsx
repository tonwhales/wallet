import React from "react";
import { memo } from "react";
import { AnimatedProductButton } from "../products/AnimatedProductButton";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useTheme } from "../../../engine/hooks";
import { View } from "react-native";
import { WImage } from "../../../components/WImage";

type DappRequestButtonProps = {
    title: string,
    subtitle: string,
    onPress: () => void,
    image?: string | null | undefined,
    divider?: boolean
}

export const DappRequestButton = memo((props: DappRequestButtonProps) => {
    const theme = useTheme();

    const icon = (
        <View>
            <WImage
                src={props.image}
                width={46}
                heigh={46}
                borderRadius={23}
            />
            <View style={{
                height: 10, width: 10,
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 5,
                position: 'absolute', top: 0, right: 0,
                justifyContent: 'center', alignItems: 'center'
            }}>
                <View style={{ backgroundColor: theme.accentRed, height: 8, width: 8, borderRadius: 4 }} />
            </View>
        </View>
    )

    return (
        <>
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                name={props.title ?? 'Unknown'}
                subtitle={props.subtitle}
                iconComponent={icon}
                value={null}
                // TODO: add onLongPress={() => {}} to remove request
                onPress={props.onPress}
                extension={true}
                style={{ marginVertical: 4, marginHorizontal: 10, backgroundColor: theme.surfaceOnBg }}
            />
            {props.divider && (
                <View style={{
                    height: 1,
                    marginHorizontal: 20,
                    backgroundColor: theme.divider
                }} />
            )}
        </>
    );
});