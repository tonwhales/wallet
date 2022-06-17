import { AutomergeValue } from "./AutomergeValue";
import * as Automerge from 'automerge';

describe('AutomergeValue', () => {
    it('should create new and update', () => {

        let schema = Automerge.change(Automerge.init<{ installer: any }>({ actorId: '0000' }), { time: 0 }, (src) => {
            src.installer = {};
        });
        let initChange = Automerge.getLastLocalChange(schema);

        // Create initial document
        let [doc1] = Automerge.applyChanges(Automerge.init<{ installer: any }>(), [initChange]);
        let doc2 = Automerge.load<{ installer: any }>(Automerge.save(doc1));
        let doc3 = Automerge.load<{ installer: any }>(Automerge.save(doc1));
        let ch = Automerge.change(doc2, (s) => {
            s.installer[1] = 2;
        });

        Automerge.merge(ch, doc3);

        let v1 = AutomergeValue.fromEmpty<{ installer: any }>((s) => { s.installer = {} });
        let v2 = AutomergeValue.fromEmpty<{ installer: any }>((s) => { s.installer = {} });
        v1.apply(v1.clone());
        // v1.apply(v2);

        // v1.update((s) => s.value.push(123));
        // v1.apply(v1.clone());
        // v2.apply(v1);
        // let s1 = v1.save();
        // let s2 = v2.save();
        // expect(s1).toEqual(s2);
    });
    it('shouold process failures', () => {

        // Existing local value
        let local = Buffer.from('hW9Kg0Iq/MUAaQECAAABLP82HuZnZERlGH6FS0MTBvsqOqJk7pUx81WEQDmqh44HAQIDAhMCIwI1AkACVgIHFQshAiMCNAFCAlYCgAECfwB/AX8BfwB/AH8Afwd/CWluc3RhbGxlZH8AfwEBfwB/AH8AAA==', 'base64');
        let value = AutomergeValue.fromExisting<{ installed: any }>(local);
        console.warn(value.getDoc());

        // Apply merge from remote
        let ll = value.clone();
        // let existing = Buffer.from('hW9Kgx8ejOMATQECAAABLP82HuZnZERlGH6FS0MTBvsqOqJk7pUx81WEQDmqh44ABxULIQIjAjQBQgJWAoABAn8JaW5zdGFsbGVkfwB/AQF/AH8AfwAA', 'base64');
        // let ex = AutomergeValue.fromExisting<{ installer: any }>(existing);
        // ll.apply(ex);
        let updated = ll.save();

        // TODO: Implement
        let tt2 = AutomergeValue.fromExisting<{ installed: any }>(updated);
        let ll2 = AutomergeValue.fromExisting<{ installed: any }>(local);
        tt2.update((s) => s.installed['asdasd'] = { name: 'asdasd' });
        ll2.apply(tt2);


        // let remote = Buffer.from('hW9Kgx8ejOMATQECAAABLP82HuZnZERlGH6FS0MTBvsqOqJk7pUx81WEQDmqh44ABxULIQIjAjQBQgJWAoABAn8JaW5zdGFsbGVkfwB/AQF/AH8AfwAA', 'base64');

        // let v1 = AutomergeValue.fromExisting<{ installer: any }>(remote);
        // let v2 = AutomergeValue.fromEmpty<{ installer: any }>((s) => { s.installer = {} });
        // v2.apply(v1);
    });

    it('shouold process failures', () => {
        let v1 = AutomergeValue.fromEmpty<{ installed: any }>((s) => { s.installed = {} });
        // console.warn(v1.save().toString('base64'));
        v1.apply(v1.clone());

        let v2 = AutomergeValue.fromExisting(v1.save());
        v2.apply(v2.clone());

        // let golden = Buffer.from('hW9Kg0Iq/MUAaQECAAABLP82HuZnZERlGH6FS0MTBvsqOqJk7pUx81WEQDmqh44HAQIDAhMCIwI1AkACVgIHFQshAiMCNAFCAlYCgAECfwB/AX8BfwB/AH8Afwd/CWluc3RhbGxlZH8AfwEBfwB/AH8AAA==', 'base64');
    });
});