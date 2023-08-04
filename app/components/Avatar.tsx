import * as React from 'react';
import { View, Image } from 'react-native';
import { avatarHash } from '../utils/avatarHash';
import SpamIcon from '../../assets/known/spam_icon.svg';

import Verified from '../../assets/ic_verified.svg';
import ContactIcon from '../../assets/ic_contacts.svg';
import { KnownWallets } from '../secure/KnownWallets';
import { KnownAvatar } from './KnownAvatar';
import { useAppConfig } from '../utils/AppConfigContext';

export const avatarImages = [
    require('../../assets/avatars/0.webp'),
    require('../../assets/avatars/1.webp'),
    require('../../assets/avatars/2.webp'),
    require('../../assets/avatars/3.webp'),
    require('../../assets/avatars/4.webp'),
    require('../../assets/avatars/5.webp'),
    require('../../assets/avatars/6.webp'),
    require('../../assets/avatars/7.webp'),
    require('../../assets/avatars/8.webp'),
    require('../../assets/avatars/9.webp'),
    require('../../assets/avatars/10.webp'),
    require('../../assets/avatars/11.webp'),
    require('../../assets/avatars/12.webp'),
    require('../../assets/avatars/13.webp'),
    require('../../assets/avatars/14.webp'),
    require('../../assets/avatars/15.webp'),
    require('../../assets/avatars/16.webp'),
    require('../../assets/avatars/17.webp'),
    require('../../assets/avatars/18.webp'),
    require('../../assets/avatars/19.webp'),
    require('../../assets/avatars/20.webp'),
    require('../../assets/avatars/21.webp'),
    require('../../assets/avatars/22.webp'),
    require('../../assets/avatars/23.webp'),
    require('../../assets/avatars/24.webp'),
    require('../../assets/avatars/25.webp'),
    require('../../assets/avatars/26.webp'),
    require('../../assets/avatars/27.webp'),
    require('../../assets/avatars/28.webp'),
    require('../../assets/avatars/29.webp'),
    require('../../assets/avatars/30.webp'),
    require('../../assets/avatars/31.webp'),
];

export const avatarColors = [
    '#294659',
    '#e56555',
    '#f28c48',
    '#8e85ee',
    '#76c84d',
    '#5fbed5',
    '#549cdd',
    '#f2749a',
    '#d1b04d'
];

export const Avatar = React.memo((props: {
    size: number,
    id: string,
    hash?: number | null,
    address?: string,
    image?: string,
    spam?: boolean,
    markContact?: boolean,
    verified?: boolean,
    dontShowVerified?: boolean,
    backgroundColor?: string
}) => {
    const { AppConfig, Theme } = useAppConfig();

    let known = props.address ? KnownWallets(AppConfig.isTestnet)[props.address] : undefined;
    let size = Math.floor(props.size * 0.6);
    let verifiedSize = Math.floor(props.size * 0.35);

    const hash = (props.hash !== undefined && props.hash !== null)
        ? props.hash
        : avatarHash(props.id, avatarImages.length);
    let imgSource = avatarImages[hash];
    let color = avatarColors[avatarHash(props.id, avatarColors.length)];
    let img: any;

    if (!props.spam) {
        if (props.image) {
            img = <Image source={{ uri: props.image }} style={{ width: props.size, height: props.size, borderRadius: props.size / 2, overflow: 'hidden' }} />;
        } else if (!known || (!known.ic) && imgSource) {
            img = <Image source={imgSource} style={{ width: props.size, height: props.size, borderRadius: props.size / 2, overflow: 'hidden' }} />;
        } else {
            img = <KnownAvatar size={props.size} wallet={known} />;
        }
    } else { // Mark avatar as spam
        img = <SpamIcon width={props.size} height={props.size} />
    }

    return (
        <View style={{
            width: props.size,
            height: props.size,
            borderRadius: props.size / 2,
            backgroundColor: (!known || !known.ic) ? (props.backgroundColor ? Theme.white : color) : undefined,
            borderColor: props.backgroundColor, borderWidth: 1,
            alignItems: 'center', justifyContent: 'center'
        }}>
            {img}
            <View style={{
                width: props.size, height: props.size,
                borderRadius: props.size / 2,
                borderWidth: 0.5,
                borderColor: 'black',
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.06
            }} />
            {(!!known || props.verified) && !props.markContact && !props.dontShowVerified && (
                <Verified
                    style={{
                        position: 'absolute', top: -1, right: -4
                    }}
                    height={verifiedSize}
                    width={verifiedSize}
                />
            )}
            {props.markContact && (
                <ContactIcon
                    style={{
                        position: 'absolute', top: -1, right: -4
                    }}
                    height={verifiedSize}
                    width={verifiedSize}
                />
            )}
        </View>
    );
});