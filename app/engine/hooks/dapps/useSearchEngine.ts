import { useRecoilState } from "recoil";
import { SearchEngine, searchEngineAtom } from "../../state/searchEngine";

export function useSearchEngine(): [SearchEngine, (value: SearchEngine) => void] {
    return useRecoilState(searchEngineAtom);
}