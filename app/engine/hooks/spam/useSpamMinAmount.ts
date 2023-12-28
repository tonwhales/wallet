import { minAmountState } from '../../state/spam';
import { useRecoilValue, useSetRecoilState } from 'recoil';

export function useSpamMinAmount(): [bigint, (value: bigint) => void] {
    const value = useRecoilValue(minAmountState);
    const update = useSetRecoilState(minAmountState);
    
    return [value, update];
}