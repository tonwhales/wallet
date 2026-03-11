import { memo } from "react";
import { Image } from 'expo-image';
import { PerfView } from "../basic/PerfView";
import { useTheme } from "../../engine/hooks";
import { AvatarIcProps, resolveAvatarIc } from "./Avatar";
import { ChangellyLogo, IcProxyCashSmall, Img_Cashback, Img_Dedust } from "@assets";
import { View } from "react-native";
import { ServiceAddressService } from "../../engine/api";

export type ForcedAvatarType = 'dedust' | 'cashback' | ServiceAddressService;

export const ForcedAvatar = memo(({
    type,
    size,
    hideVerifIcon,
    icProps,
    borderColor,
    borderWidth
}: {
    type: ForcedAvatarType,
    size: number,
    hideVerifIcon?: boolean,
    icProps?: AvatarIcProps,
    borderColor?: string,
    borderWidth?: number
}) => {
    const theme = useTheme();
    let icSize = icProps?.size ?? Math.floor(size * 0.43);
    let icOutline = Math.round(icSize * 0.03) > 2 ? Math.round(icSize * 0.03) : 2;
    if (!!icProps?.borderWidth) {
        icOutline = icProps?.borderWidth;
    }
    const icOffset = -(icSize - icOutline) / 2;
    let icPosition: { top?: number, bottom?: number, left?: number, right?: number } = { bottom: -2, right: -2 };

    switch (icProps?.position) {
        case 'top':
            icPosition = { top: icOffset };
            break;
        case 'left':
            icPosition = { bottom: -icOutline, left: -icOutline };
            break;
        case 'right':
            icPosition = { bottom: -icOutline, right: -icOutline };
            break;
        case 'bottom':
            icPosition = { bottom: icOffset };
            break;
    }
    let verifIcon = hideVerifIcon
        ? null
        : resolveAvatarIc({ verified: true, icProps, icPosition, icSize, icOutline }, theme);
    let img = null;

    switch (type) {
        case 'dedust':
            img = <Image
                source={Img_Dedust}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
            break;
        case 'holders':
            img = <Image
                source={require('@assets/ic-holders-accounts.png')}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
            break;
        case 'cashback':
            img = <Image
                source={Img_Cashback}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
            break;
        case 'postcash':
            img = <View style={{
                width: size, height: size,
                borderRadius: size / 2,
                overflow: 'hidden',
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: theme.surfaceOnBg,
            }}>
                <IcProxyCashSmall
                    width={size * 0.95} height={size * 0.95}
                    style={{ height: size * 0.95, width: size * 0.95 }}
                />
            </View>
            break;
        case 'changelly':
            img = <View style={{
                width: size, height: size,
                borderRadius: size / 2,
                overflow: 'hidden',
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: theme.surfaceOnBg,
            }}>
                <ChangellyLogo width={size * 1.2} height={size * 1.2} />
            </View>
            break;
    }

    return (
        <PerfView style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center', justifyContent: 'center',
        }}>
            <PerfView
                style={{
                    width: size, height: size, borderRadius: size / 2,
                    justifyContent: 'center', alignItems: 'center',
                    borderColor, borderWidth,
                    overflow: 'hidden'
                }}
            >
                {img}
            </PerfView>
            {verifIcon}
        </PerfView>
    );
});