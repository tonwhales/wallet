import * as Automerge from 'automerge';

export class AutomergeValue<T> {

    static fromEmpty<T>(initial: (src: T) => void) {
        // Create schema
        let schema = Automerge.change(Automerge.init<T>({ actorId: '0000' }), { time: 0 }, (src) => {
            initial(src as T);
        });
        let initChange = Automerge.getLastLocalChange(schema);

        // Create initial document
        let [doc] = Automerge.applyChanges(Automerge.init<T>(), [initChange]);

        return new AutomergeValue<T>(Automerge.load(Automerge.save(doc)));
    }

    static fromExisting<T>(src: Buffer) {
        return new AutomergeValue<T>(Automerge.load<T>(src as any));
    }

    #doc: Automerge.Doc<T>;

    private constructor(initial: Automerge.Doc<T>) {
        this.#doc = initial;
    }


    update(updater: (src: T) => void) {
        this.#doc = Automerge.change(this.#doc, (s) => {
            updater(s as T);
        });
    }

    apply(remote: AutomergeValue<T>) {
        if (Automerge.equals(remote.#doc, this.#doc)) {
            return;
        }
        this.#doc = Automerge.merge(this.#doc, remote.#doc);
    }

    getDoc() {
        return this.#doc;
    }

    save() {
        return Buffer.from(Automerge.save(this.#doc));
    }

    clone() {
        return AutomergeValue.fromExisting<T>(this.save());
    }
}