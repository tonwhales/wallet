import { useRecoilValue } from "recoil";
import { lastWatchedBlockAtom } from "../state/blockWatcherState";

export function useLastWatchedBlock() {
    return useRecoilValue(lastWatchedBlockAtom);
}