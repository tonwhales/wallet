export class LazyMap<K, V> {
    #map = new Map<K, V>();
    #factory: (src: K) => V;

    constructor(factory: (src: K) => V) {
        this.#factory = factory;
    }

    get(key: K) {
        let ex = this.#map.get(key);
        if (!ex) {
            let v = this.#factory(key);
            this.#map.set(key, v);
            return v;
        } else {
            return ex;
        }
    }
}