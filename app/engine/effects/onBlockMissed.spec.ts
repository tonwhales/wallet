import { getMissedBlocksRange } from './onBlockMissed';

describe('onBlockMissed', () => {
    it('should find correct range', () => {
        expect(getMissedBlocksRange(1, 5)).toEqual([2, 3, 4]);
    });
});