import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../../../engine/hooks";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";
import { ASSET_ITEM_HEIGHT } from "../../../utils/constants";

export const TonAssetItem = memo(({ onSelect }: { onSelect: () => void }) => {
    const theme = useTheme();

    return (
        <View style={{ height: ASSET_ITEM_HEIGHT }}>
            <Pressable
                style={{
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 20,
                    marginBottom: 16,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
                onPress={onSelect}
            >
                <View style={{ width: 46, height: 46 }}>
                    <Image
                        source={require('@assets/ic-ton-acc.png')}
                        style={{ height: 46, width: 46 }}
                    />
                </View>
                <View style={{ justifyContent: 'center', flexGrow: 1, flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={[{ flexShrink: 1, color: theme.textPrimary }, Typography.semiBold17_24]}>
                            {'Toncoin'}
                        </Text>
                        <Image
                            source={require('@assets/ic-verified.png')}
                            style={{ height: 20, width: 20 }}
                        />
                    </View>
                    <Text
                        style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        {t('savings.ton')}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Image
                        source={require('@assets/ic-chevron-right.png')}
                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                    />
                </View>
            </Pressable>
        </View>
    );
});
