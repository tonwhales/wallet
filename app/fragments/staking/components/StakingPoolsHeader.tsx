import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { ItemHeader } from "../../../components/ItemHeader";
import { useAppConfig } from "../../../utils/AppConfigContext";

export const StakingPoolsHeader = memo((props: {
    text: string,
    description?: string,
    action?: { title: string, onAction: () => void }
}) => {
    const { Theme } = useAppConfig();
    return (
        <View style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16
        }}>
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <ItemHeader
                    title={props.text}
                    style={{ flexShrink: 1 }}
                />
                {!!props.action && (
                    <Pressable style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.3 : 1,
                            alignSelf: 'flex-end',
                        }
                    }}
                        onPress={props.action.onAction}
                    >
                        <Text style={{
                            fontSize: 15, lineHeight: 20,
                            fontWeight: '500',
                            color: Theme.accent,
                            textAlign: 'right'
                        }}
                            numberOfLines={1}
                        >
                            {props.action.title}
                        </Text>
                    </Pressable>
                )}
            </View>
            {!!props.description && (
                <Text style={{
                    maxWidth: '70%',
                    fontSize: 14, color: Theme.textSecondary,
                    marginTop: 2
                }}>
                    {props.description}
                </Text>
            )}
        </View>
    );
})

