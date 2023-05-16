import React from "react"
import { useWindowDimensions, Text, Image, Pressable, View } from "react-native"
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from "expo-blur";
import { ScalingPressable } from "../ScalingPressable";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import AddIcon from "../../../assets/ic_add.svg";

export const NewAccountCard = React.memo(() => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const window = useWindowDimensions();
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);
    const cardWidth = window.width - 32;

    const onAddNewAccount = React.useCallback(() => {
        navigation.navigate('WalletImport', { newAccount: true });
    }, []);

    return (
        <ScalingPressable
            style={{
                height: cardHeight,
                width: cardWidth,
                marginRight: 16, marginVertical: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 16,
                overflow: 'hidden',
            }}
            onPress={onAddNewAccount}
        >
            <Image
                source={require('../../../assets/wallet_card.png')}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: cardHeight,
                    width: cardWidth
                }}
                resizeMode="stretch"
                resizeMethod="resize"
            />
            <BlurView
                intensity={20}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                    <AddIcon color={Theme.item} />
                    <Text style={{ marginLeft: 8, color: Theme.item, fontWeight: '600', fontSize: 20 }}>
                        {t('wallets.addNewTitle')}
                    </Text>
                </View>
            </BlurView>
        </ScalingPressable>
    );
});