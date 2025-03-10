import { resolveSearchParams } from "./resolveSearchParams";

describe('resolveSearchParams', () => {
    it('should resolve campaignId', () => {
        const url = 'https://tonhub.com/holders?path=%2F&campaignId=cm7ygalqh07ola32k399qkeep';
        const params = resolveSearchParams(url);
        expect(params).toMatchObject({ campaignId: 'cm7ygalqh07ola32k399qkeep' });
    });

    it('should resolve random params', () => {
        const url = 'https://tonhub.com/holders?random=123';
        const params = resolveSearchParams(url);
        expect(params).toEqual({ random: '123' });
    });

    it('should resolve multiple params', () => {
        const url = 'https://tonhub.com/holders?path=%2F&random=123&campaignId=cm7ygalqh07ola32k399qkeep';
        const params = resolveSearchParams(url);
        expect(params).toEqual({ random: '123', campaignId: 'cm7ygalqh07ola32k399qkeep', path: '/' });
    });

    it('should resolve with no params', () => {
        const url = 'https://tonhub.com/holders';
        const params = resolveSearchParams(url);
        expect(params).toEqual({});
    });

    it('should resolve with no holders', () => {
        const url = 'https://tonhub.com?path=%2F';
        const params = resolveSearchParams(url);
        expect(params).toEqual({});
    });
});