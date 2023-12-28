import { Address } from "@ton/ton";


export class ConfigStore {
    #map = new Map<string, string>();

    constructor(source?: string | undefined | null) {
        if (source) {
            let parts = source.split(',');
            for (let p of parts) {
                let pp = p.split('=');
                if (pp.length !== 2) {
                    throw Error('Mailformed input');
                }
                if (this.#map.has(pp[0])) {
                    throw Error('Mailformed input');
                }
                this.#map.set(pp[0], pp[1]);
            }
        }
    }

    getString = (key: string) => {
        let ex = this.#map.get(key);
        if (!ex) {
            throw Error('Unable to find key ' + key);
        }
        return ex;
    }

    getBuffer = (key: string) => {
        return Buffer.from(this.getString(key), 'hex');
    }

    getAddress = (key: string) => {
        return Address.parseFriendly(this.getString(key)).address;
    };

    getInt = (key: string) => {
        return parseInt(this.getString(key));
    }

    setString(key: string, value: string) {
        if (key.indexOf('=') >= 0 || key.indexOf(',') >= 0) {
            throw Error('Mailformed input');
        }
        if (value.indexOf('=') >= 0 || value.indexOf(',') >= 0) {
            throw Error('Mailformed input');
        }
        this.#map.set(key, value);
    }

    setInt(key: string, value: number) {
        this.setString(key, value.toString(10));
    }

    setBuffer = (key: string, value: Buffer) => {
        this.setString(key, value.toString('hex'));
    }

    setAddress = (key: string, address: Address) => {
        this.setString(key, address.toString());
    }

    save() {
        let res = '';
        for (let e of this.#map) {
            if (res !== '') {
                res += ',';
            }
            res += e[0] + '=' + e[1];
        }
        return res;
    }
}