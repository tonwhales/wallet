import { memo } from "react";
import { Image } from 'expo-image';
import { PerfView } from "../basic/PerfView";
import { useTheme } from "../../engine/hooks";
import { AvatarIcProps, resolveAvatarIc } from "./Avatar";

export type ForcedAvatarType = 'dedust' | 'holders' | 'ledger';

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
                source={require('@assets/known/ic-dedust.png')}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
            break;
        case 'holders':
            img = <Image
                source={require('@assets/ic-holders-accounts.png')}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
            break;
        case 'ledger':
            img = <Image
                source={require('@assets/ledger_device.png')}
                style={{ height: size, width: size, borderRadius: size / 2 }}
            />
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