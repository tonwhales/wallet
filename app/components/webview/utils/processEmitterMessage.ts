
export enum DAppEmitterEvents {
    APP_READY = 'appReady'
}

export function processEmitterMessage(
    parsed: any,
    setLoaded: (loaded: boolean) => void,
) {
    const name = parsed.data.name;
    const event = parsed.data.args.event;

    if (
        typeof name === 'string'
        && (name as string) === 'dapp-emitter'
        && !!event
        && typeof event === 'string'
    ) {
        switch (event) {
            case DAppEmitterEvents.APP_READY:
                setLoaded(true);
                break;
            default:
                break;
        }
        return true;
    }
    return false;
}