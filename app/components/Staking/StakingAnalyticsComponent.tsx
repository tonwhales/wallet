import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { Address } from "ton";

export const StakingAnalyticsComponent = memo(({ pool }: { pool: Address }) => {
    const { Theme } = useAppConfig();

    return (
        <View style={{ flexDirection: 'row', flex: 1, }}>
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? .5 : 1, flex: 1 })}
                onPress={() => {

                }}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: Theme.surfaceSecondary,
                    borderRadius: 20,
                    padding: 20, marginRight: 16,
                    minHeight: 126
                }}>
                    <Text style={{
                        color: Theme.textPrimary,
                        fontWeight: '600',
                        fontSize: 17, lineHeight: 24
                    }}>
                        {'Operations'}
                    </Text>
                    <Text style={{
                        color: Theme.textSecondary,
                        fontWeight: '600',
                        fontSize: 15, lineHeight: 20, marginTop: 2
                    }}>
                        {'Top Up and Withdraw'}
                    </Text>
                </View>
            </Pressable>
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? .5 : 1, flex: 1 })}
                onPress={() => {

                }}
            >
                <View style={{
                    backgroundColor: Theme.surfaceSecondary,
                    borderRadius: 20,
                    padding: 20,
                    minHeight: 126
                }}>
                    <Text style={{
                        color: Theme.textPrimary,
                        fontWeight: '600',
                        fontSize: 17, lineHeight: 24
                    }}>
                        {'Analytics'}
                    </Text>
                    <Text style={{
                        color: Theme.textSecondary,
                        fontWeight: '600',
                        fontSize: 15, lineHeight: 20, marginTop: 2
                    }}>
                        {'Total profit'}
                    </Text>
                </View>
            </Pressable>
        </View >
    );
});