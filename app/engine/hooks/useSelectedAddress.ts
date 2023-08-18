import { getAppState } from '../../storage/appState';

export function useSelectedAddress() {
    let state = getAppState();

    return state.addresses[state.selected];
}