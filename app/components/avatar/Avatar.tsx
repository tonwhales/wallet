import * as React from 'react';
import { avatarHash } from '../../utils/avatarHash';
import { KnownAvatar } from './KnownAvatar';
import { Image as ExpoImage } from 'expo-image';
import { ReactNode, memo } from 'react';
import { PerfText } from '../basic/PerfText';
import { PerfView } from '../basic/PerfView';
import { ThemeType } from '../../engine/state/theme';
import { KnownWallet } from '../../secure/KnownWallets';

export const avatarImages = [
    require('@assets/avatars/0.png'),
    require('@assets/avatars/1.png'),
    require('@assets/avatars/2.png'),
    require('@assets/avatars/3.png'),
    require('@assets/avatars/4.png'),
    require('@assets/avatars/5.png'),
    require('@assets/avatars/6.png'),
    require('@assets/avatars/7.png'),
    require('@assets/avatars/8.png'),
    require('@assets/avatars/9.png'),
    require('@assets/avatars/10.png'),
    require('@assets/avatars/11.png'),
    require('@assets/avatars/12.png'),
    require('@assets/avatars/13.png'),
    require('@assets/avatars/14.png'),
    require('@assets/avatars/15.png'),
    require('@assets/avatars/16.png'),
    require('@assets/avatars/17.png'),
    require('@assets/avatars/18.png'),
    require('@assets/avatars/19.png'),
    require('@assets/avatars/20.png'),
    require('@assets/avatars/21.png'),
    require('@assets/avatars/22.png'),
    require('@assets/avatars/23.png'),
    require('@assets/avatars/24.png'),
    require('@assets/avatars/25.png'),
    require('@assets/avatars/26.png'),
    require('@assets/avatars/27.png'),
    require('@assets/avatars/28.png'),
    require('@assets/avatars/29.png')
];

const myWalletSource = require('@assets/ic-my-wallet.png');
const verifiedSource = require('@assets/ic-verified.png');
const contactSource = require('@assets/ic-contact.png');

export const avatarColors = [
    '#C07DF4',
    '#6DC2FF',
    '#A6A6A6',
    '#FAE140',
    '#43CAA2',
    '#FF76A8',
    '#4886FF',
    '#FFA766'
];

export type AvatarIcProps = {
    isOwn?: boolean,
    borderWidth?: number,
    position?: 'top' | 'bottom' | 'left' | 'right',
    backgroundColor?: string,
    size?: number,
};

export function resolveAvatarIc(
    params: {
        markContact?: boolean,
        isSpam?: boolean,
        verified?: boolean,
        dontShowVerified?: boolean,
        icProps?: AvatarIcProps,
        icPosition: { top?: number, bottom?: number, left?: number, right?: number },
        icSize: number,
        known?: boolean,
        icOutline: number
    },
    theme: ThemeType
): React.ReactNode | null {
    const { markContact, verified, dontShowVerified, icProps, isSpam, icPosition, icSize, known, icOutline } = params;

    if (isSpam) {
        return null;
    }

    if (icProps?.isOwn) {
        return (
            <PerfView style={[
                {
                    justifyContent: 'center', alignItems: 'center',
                    height: icSize, width: icSize,
                    borderRadius: Math.round(icSize / 4),
                    backgroundColor: icProps?.backgroundColor ?? theme.surfaceOnElevation,
                    position: 'absolute',
                },
                icPosition
            ]}>
                <ExpoImage
                    source={myWalletSource}
                    style={{
                        width: icSize,
                        height: icSize,
                        tintColor: theme.iconPrimary
                    }}
                />
            </PerfView>
        );
    }

    if (markContact) {
        return (
            <PerfView style={[
                {
                    justifyContent: 'center', alignItems: 'center',
                    height: icSize, width: icSize,
                    borderRadius: icSize / 2,
                    backgroundColor: icProps?.backgroundColor ?? theme.surfaceOnElevation,
                    position: 'absolute', overflow: 'hidden'
                },
                icPosition
            ]}>
                <ExpoImage
                    source={contactSource}
                    style={{
                        width: icSize - (2 * icOutline),
                        height: icSize - (2 * icOutline),
                        tintColor: theme.iconPrimary
                    }}
                />
            </PerfView>
        );
    } else if ((known || verified) && !dontShowVerified) {
        return (
            <PerfView style={[{
                position: 'absolute',
                justifyContent: 'center', alignItems: 'center',
                width: icSize, height: icSize, borderRadius: icSize,
                backgroundColor: icProps?.backgroundColor ?? theme.surfaceOnElevation
            }, icPosition]}>
                <ExpoImage
                    source={verifiedSource}
                    style={{ height: icSize, width: icSize }}
                />
            </PerfView>
        );
    }

    return null;
}

export const Avatar = memo((props: {
    size: number,
    id: string,
    hash?: number | null,
    address?: string,
    image?: string,
    spam?: boolean,
    showSpambadge?: boolean,
    markContact?: boolean,
    verified?: boolean,
    dontShowVerified?: boolean,
    borderColor?: string,
    borderWidth?: number,
    backgroundColor?: string,
    icProps?: AvatarIcProps,
    theme: ThemeType,
    hashColor?: { hash: number } | boolean,
    knownWallets: { [key: string]: KnownWallet }
}) => {
    const { theme, address, hashColor, icProps, size, showSpambadge, spam, markContact, verified, dontShowVerified, borderColor, borderWidth, image } = props
    const known = address ? props.knownWallets[address] : undefined;
    const hash = (props.hash !== undefined && props.hash !== null)
        ? props.hash
        : avatarHash(props.id, avatarImages.length);
    const imgSource = avatarImages[hash];
    const color = avatarColors[avatarHash(props.id, avatarColors.length)];

    // resolve image
    let img: ReactNode;

    if (props.image) {
        img = (
            <ExpoImage
                source={{ uri: props.image }}
                style={{ width: props.size, height: props.size, borderRadius: props.size / 2, overflow: 'hidden' }}
            />
        );
    } else if (!known || (!known.ic) && imgSource) {
        const animalSize = props.size + 8
        img = (
            <ExpoImage
                source={imgSource}
                style={{ width: animalSize, height: animalSize, borderRadius: animalSize / 2, overflow: 'hidden' }}
            />
        );
    } else {
        img = <KnownAvatar size={props.size} wallet={known} />;
    }

    let avatarBackgroundClr: string | undefined = props.backgroundColor ?? theme.surfaceOnElevation;

    if (!!known && !!known?.ic) {
        avatarBackgroundClr = theme.backgroundPrimary;
    } else if (hashColor) {
        avatarBackgroundClr = color;
    }

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

    let isSpam = showSpambadge && spam;
    let ic = resolveAvatarIc({ markContact, verified, dontShowVerified, icProps, isSpam, icPosition, icSize, known: !!known, icOutline }, theme);

    if (image) {
        img = (
            <ExpoImage
                source={{ uri: image }}
                style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
            />
        );
    } else if (!known || (!known.ic) && imgSource) {
        const animalSize = size + 8
        img = (
            <ExpoImage
                source={imgSource}
                style={{ width: animalSize, height: animalSize, borderRadius: animalSize / 2, overflow: 'hidden' }}
            />
        );
    } else {
        img = <KnownAvatar size={size} wallet={known} />;
    }

    return (
        <PerfView>
            <PerfView style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <PerfView style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: avatarBackgroundClr ?? color,
                    borderColor: borderColor ?? color,
                    borderWidth: borderWidth ?? 1,
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    <PerfView style={{ opacity: spam ? .5 : 1 }}>
                        {img}
                    </PerfView>
                </PerfView>
                {ic}
            </PerfView>
            {isSpam && (
                <PerfView style={{ borderRadius: 100, padding: 2, backgroundColor: theme.surfaceOnElevation }}>
                    <PerfView style={{
                        backgroundColor: theme.backgroundPrimaryInverted,
                        borderRadius: 100,
                        height: 15,
                        paddingHorizontal: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        position: 'absolute', bottom: 0,
                        width: 40,
                    }}>
                        <PerfText style={{
                            fontSize: 10,
                            fontWeight: '500',
                            color: theme.textPrimaryInverted,
                            flexShrink: 1
                        }}>
                            {'SPAM'}
                        </PerfText>
                    </PerfView>
                </PerfView>
            )}
        </PerfView>
    );
});
Avatar.displayName = 'AvatarView';