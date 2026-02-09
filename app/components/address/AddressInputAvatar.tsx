import { memo } from "react";
import { Image } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Avatar } from "../avatar/Avatar";
import { KnownWallet } from "../../secure/KnownWallets";
import { ForcedAvatar, ForcedAvatarType } from "../avatar/ForcedAvatar";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PublicProfileAvatar } from "../avatar/PublicProfileAvatar";

export const AddressInputAvatar = memo(({
    size,
    theme,
    friendly,
    isOwn,
    markContact,
    hash,
    isLedger,
    avatarColor,
    knownWallets,
    forceAvatar,
    disableFade
}: {
    size: number,
    theme: ThemeType,
    friendly?: string,
    isOwn: boolean,
    markContact: boolean,
    hash?: number | null,
    isLedger?: boolean,
    avatarColor: string,
    knownWallets?: { [key: string]: KnownWallet },
    forceAvatar?: ForcedAvatarType
    disableFade?: boolean
}) => {

    let avatar = null;

    if (forceAvatar) {
        avatar = (
            <ForcedAvatar
                type={forceAvatar}
                size={size}
                icProps={{ isOwn }}
            />
        );
    } else if (friendly) {
        const avatarComponent = (
            <PublicProfileAvatar
                enablePublicProfile={true}
                size={size}
                address={friendly}
                theme={theme}
                id={friendly}
            />
        );

        if (disableFade) {
            avatar = avatarComponent;
        } else {
            avatar = (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    {avatarComponent}
                </Animated.View>
            );
        }
    }

    return (
        <View style={{ height: size, width: size, justifyContent: 'center', alignItems: 'center' }}>
            <Image
                source={require('@assets/ic-contact.png')}
                style={{ height: size, width: size, tintColor: theme.iconPrimary, position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
            />
            {avatar}
        </View>
    );
});

AddressInputAvatar.displayName = 'AddressInputAvatar';