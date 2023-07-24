import { useRecoilValue } from "recoil";
import { Engine } from "../Engine";
import { Address } from "ton";
import { WalletV4State } from "../sync/startWalletV4Sync";
import { avatarHash } from "../../utils/avatarHash";
import { avatarImages } from "../../components/Avatar";
import { SvgProps } from "react-native-svg";

export type WalletSettings = {
    name: string | null,
    avatar: number | null
}

export class WalletsProduct {
    engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    useWallet(address: Address): WalletV4State | null {
        return useRecoilValue(this.engine.persistence.wallets.item(address).atom);
    }

    useWalletSettings(address: Address): WalletSettings | null {
        return useRecoilValue(this.engine.sharedPersistence.walletSettings.item(address).atom);
    }

    setWalletSettings(address: Address, settings: WalletSettings): void {
        this.engine.sharedPersistence.walletSettings.item(address).update((src) => settings);
    }

    getAvatar(address: Address, settings: WalletSettings | null): React.FC<SvgProps> {
        if (!!settings?.avatar) {
            return avatarImages[settings.avatar];
        }
        return avatarImages[avatarHash(address.toFriendly({ testOnly: this.engine.isTestnet }), avatarImages.length)];
    }
}
