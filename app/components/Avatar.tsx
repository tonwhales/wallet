import * as React from 'react';
import { Image } from 'react-native';
import { avatarHash } from '../utils/avatarHash';
import { KnownWallets } from '../secure/KnownWallets';
import { KnownAvatar } from './KnownAvatar';
import FastImage from 'react-native-fast-image';
import { memo } from 'react';
import { PerfText } from './basic/PerfText';
import { PerfView } from './basic/PerfView';
import { ThemeType } from '../engine/state/theme';

export const avatarImages = [
    require('@assets/avatars/0.png'),
    require('@assets/avatars/1.png'),
    require('@assets/avatars/2.png'),
    require('@assets/avatars/3.png'),
    require('@assets/avatars/4.png'),
    require('@assets/avatars/5.png'),
    require('@assets/avatars/6.png'),
    require('@assets/avatars/7.png'),
    // require('@assets/avatars/8.webp'),
    // require('@assets/avatars/9.webp'),
    // require('@assets/avatars/10.webp'),
    // require('@assets/avatars/11.webp'),
    // require('@assets/avatars/12.webp'),
    // require('@assets/avatars/13.webp'),
    // require('@assets/avatars/14.webp'),
    // require('@assets/avatars/15.webp'),
    // require('@assets/avatars/16.webp'),
    // require('@assets/avatars/17.webp'),
    // require('@assets/avatars/18.webp'),
    // require('@assets/avatars/19.webp'),
    // require('@assets/avatars/20.webp'),
    // require('@assets/avatars/21.webp'),
    // require('@assets/avatars/22.webp'),
    // require('@assets/avatars/23.webp'),
    // require('@assets/avatars/24.webp'),
    // require('@assets/avatars/25.webp'),
    // require('@assets/avatars/26.webp'),
    // require('@assets/avatars/27.webp'),
    // require('@assets/avatars/28.webp'),
    // require('@assets/avatars/29.webp'),
    // require('@assets/avatars/30.webp'),
    // require('@assets/avatars/31.webp'),
];

const myWalletSource = require('@assets/ic-my-wallet.png');
const verifiedSource = require('@assets/ic-verified.png');
const contactSource = require('@assets/ic-contact.png');

export const avatarColors = [
    '#B36DEA',
    '#61BDFF',
    '#A6A6A6',
    '#F6D615',
    '#42B98E',
    '#FE6099',
    '#3877F2',
    '#FF9A50'
];

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
    borderWith?: number,
    backgroundColor?: string,
    icProps?: {
        isOwn?: boolean,
        borderWidth?: number,
        position?: 'top' | 'bottom' | 'left' | 'right',
        backgroundColor?: string,
        size?: number,
    },
    theme: ThemeType,
    isTestnet: boolean,
    hashColor?: boolean
}) => {
    const theme = props.theme;
    const isTestnet = props.isTestnet;

    let known = props.address ? KnownWallets(isTestnet)[props.address] : undefined;


    const hash = (props.hash !== undefined && props.hash !== null)
        ? props.hash
        : avatarHash(props.id, avatarImages.length);
    let imgSource = avatarImages[hash];
    let color = avatarColors[avatarHash(props.id, avatarColors.length)];
    let img: any;
    console.log({ imgSource })

    if (props.image) {
        img = (
            <FastImage
                source={{ uri: props.image }}
                style={{ width: props.size, height: props.size, borderRadius: props.size / 2, overflow: 'hidden' }}
            />
        );
    } else if (!known || (!known.ic) && imgSource) {
        img = (
            <FastImage
                source={imgSource}
                style={{ width: props.size, height: props.size, borderRadius: props.size / 2, overflow: 'hidden' }}
            />
        );
    } else {
        img = <KnownAvatar size={props.size} wallet={known} />;
    }

    let backgroundColor: string | undefined = props.backgroundColor ?? theme.surfaceOnElevation;

    if (props.hashColor) {
        backgroundColor = color;
    }

    if (known && known?.ic) {
        backgroundColor = theme.white;
    }

    let icSize = props.icProps?.size ?? Math.floor(props.size * 0.43);
    let icOutline = Math.round(icSize * 0.03) > 2 ? Math.round(icSize * 0.03) : 2;
    if (!!props.icProps?.borderWidth) {
        icOutline = props.icProps?.borderWidth;
    }
    const icOffset = -(icSize - icOutline) / 2;
    let icPosition: {} = { bottom: -2, right: -2 };

    switch (props.icProps?.position) {
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

    let spam = props.showSpambadge && props.spam;
    let ic = null;

    if (props.markContact) {
        ic = (
            <PerfView style={[
                {
                    justifyContent: 'center', alignItems: 'center',
                    height: icSize, width: icSize,
                    borderRadius: icSize / 2,
                    backgroundColor: props.icProps?.backgroundColor ?? theme.surfaceOnElevation,
                    position: 'absolute', overflow: 'hidden'
                },
                icPosition
            ]}>
                <Image
                    source={contactSource}
                    style={{
                        width: icSize - (2 * icOutline),
                        height: icSize - (2 * icOutline),
                        tintColor: theme.iconPrimary
                    }}
                />
            </PerfView>
        );
    } else if ((!!known || props.verified) && !props.dontShowVerified && !spam) {
        ic = (
            <PerfView style={[{
                position: 'absolute',
                justifyContent: 'center', alignItems: 'center',
                width: icSize, height: icSize, borderRadius: icSize,
                backgroundColor: props.icProps?.backgroundColor ?? theme.surfaceOnElevation
            }, icPosition]}>
                <Image
                    source={verifiedSource}
                    style={{ height: icSize, width: icSize }}
                />
            </PerfView>
        );
    }

    if (props.icProps?.isOwn) {
        ic = (
            <PerfView style={[
                {
                    justifyContent: 'center', alignItems: 'center',
                    height: icSize, width: icSize,
                    borderRadius: Math.round(icSize / 4),
                    backgroundColor: props.icProps?.backgroundColor ?? theme.surfaceOnElevation,
                    position: 'absolute',
                },
                icPosition
            ]}>
                <Image
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

    if (spam) {
        ic = null;
    }

    return (
        <PerfView>
            <PerfView style={{
                width: props.size,
                height: props.size,
                borderRadius: props.size / 2,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <PerfView style={{
                    width: props.size,
                    height: props.size,
                    borderRadius: props.size / 2,
                    backgroundColor: backgroundColor ?? color,
                    borderColor: props.borderColor ?? color,
                    borderWidth: props.borderWith !== undefined ? props.borderWith : 1,
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    <PerfView style={{ opacity: props.spam ? .5 : 1 }}>
                        {img}
                    </PerfView>
                </PerfView>
                {ic}
            </PerfView>
            {spam && (
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