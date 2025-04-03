import { memo } from "react";
import { Image } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Avatar } from "../avatar/Avatar";
import { KnownWallet } from "../../secure/KnownWallets";
import { ForcedAvatar, ForcedAvatarType } from "../avatar/ForcedAvatar";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

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
    forceAvatar
}: {
    size: number,
    theme: ThemeType,
    friendly?: string,
    isOwn: boolean,
    markContact: boolean,
    hash: number | null
    isLedger?: boolean,
    avatarColor: string,
    knownWallets: { [key: string]: KnownWallet },
    forceAvatar?: ForcedAvatarType
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
        avatar = (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Avatar
                    size={size}
                    id={friendly}
                    address={friendly}
                    borderColor={theme.elevation}
                    theme={theme}
                    hash={hash}
                    knownWallets={knownWallets}
                    backgroundColor={avatarColor}
                    markContact={markContact}
                    icProps={{ isOwn }}
                    borderWidth={0}
                    isLedger={isLedger}
                />
            </Animated.View>
        );
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