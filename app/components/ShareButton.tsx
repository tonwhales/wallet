import React, { useCallback } from "react";
import { Pressable, StyleProp, View, ViewStyle, Text, Platform, Share, TextStyle } from "react-native";
import ShareIcon from '../../assets/ic_share_address.svg';
import { t } from "../i18n/t";
import { useAppConfig } from "../utils/AppConfigContext";

const size = {
    height: 56,
    fontSize: 17,
    hitSlop: 0,
    pad: Platform.OS == 'ios' ? 0 : -1
}

export const ShareButton = React.memo(({
    body,
    style,
    disabled,
    showIcon,
    textStyle,
    onScreenCapture
}: {
    body: string,
    style?: StyleProp<ViewStyle>,
    disabled?: boolean,
    showIcon?: boolean,
    textStyle?: StyleProp<TextStyle>,
    onScreenCapture?: () => { uri: string }
}) => {
    const { Theme } = useAppConfig();
    const display = {
        backgroundColor: Theme.secondaryButton,
        borderColor: Theme.secondaryButton,
        textColor: Theme.textColor,

        backgroundPressedColor: Theme.selector,
        borderPressedColor: Theme.selector,
        textPressed: Theme.secondaryButtonText
    }
    const onShare = useCallback(() => {

        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: body });
        } else {
            Share.share({ title: t('receive.share.title'), message: body });
        }
    }, [body]);

    return (
        <Pressable
            disabled={disabled}
            hitSlop={size.hitSlop}
            style={(p) => ([
                {
                    flex: 1,
                    borderWidth: 1,
                    borderRadius: 14,
                    backgroundColor: display.backgroundColor,
                    borderColor: display.borderColor,
                    overflow: 'hidden'
                },
                p.pressed && {
                    opacity: 0.55
                },
                style])}
            onPress={onShare}
        >
            <View style={{
                height: size.height - 2,
                flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center',
                minWidth: 64,
            }}>
                <View style={{
                    position: 'absolute',
                    left: 0, right: 0, bottom: 0, top: 0,
                    flexGrow: 1
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexGrow: 1,
                        paddingHorizontal: 16,
                    }}>
                        {showIcon && (
                            <View style={{ marginRight: 10 }}>
                                <ShareIcon width={15} height={24} />
                            </View>
                        )}
                        <Text
                            style={[
                                {
                                    color: display.textColor,
                                    fontSize: size.fontSize,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                    flexShrink: 1
                                },
                                textStyle
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                        >
                            {t('common.share')}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});
