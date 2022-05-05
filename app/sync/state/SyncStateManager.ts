import { log, warn } from "../../utils/log";
import { ReactSync } from "../react/ReactSync";

export class SyncStateManager {
    #connecting = 0;
    #updating = 0;
    #state = new ReactSync<'connecting' | 'online' | 'updating'>();

    constructor() {
        this.#state.value = 'online';
    }

    use() {
        return this.#state.use();
    }

    beginConnecting() {
        this.#connecting++;
        this.#updateState();

        let released = false;
        return () => {
            if (released) {
                warn('Already released');
                return;
            }
            released = true;
            this.#connecting--;
            this.#updateState();
        };
    }

    beginUpdating() {
        this.#updating++;
        this.#updateState();

        let released = false;
        return () => {
            if (released) {
                warn('Already released');
                return;
            }
            released = true;
            this.#updating--;
            this.#updateState();
        };
    }

    #updateState() {
        if (this.#connecting > 0) {
            if (this.#state.value !== 'connecting') {
                log('[state]: ' + this.#state.value + ' -> connecting');
                this.#state.value = 'connecting';
            }
        } else if (this.#updating > 0) {
            if (this.#state.value !== 'updating') {
                log('[state]: ' + this.#state.value + ' -> updating');
                this.#state.value = 'updating';
            }
        } else {
            if (this.#state.value !== 'online') {
                log('[state]: ' + this.#state.value + ' -> online');
                this.#state.value = 'online';
            }
        }
    }
}