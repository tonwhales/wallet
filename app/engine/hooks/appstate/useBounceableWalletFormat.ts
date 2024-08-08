import { useRecoilState } from "recoil";
import { bounceableWalletFormatAtom } from "../../state/bounceableWalletFormat";
import { useWalletVersion } from "../useWalletVersion";
import { WalletVersions } from "../../state/walletVersions";

export function useBounceableWalletFormat(skipVersion?: boolean): [boolean, (valOrUpdater: ((currVal: boolean) => boolean) | boolean) => void] {
    const version = useWalletVersion();
    const [state, updater] = useRecoilState(bounceableWalletFormatAtom);

    const isBounceable = !skipVersion && version === WalletVersions.v5R1 ? false : state;

    return [isBounceable, updater];
}