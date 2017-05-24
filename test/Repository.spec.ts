import 'babel-polyfill';

import * as PouchDB from 'pouchdb-core';
import * as memory from 'pouchdb-adapter-memory';

import {Repository} from '../src/index';
import {expect} from 'chai';

PouchDB.plugin(memory);

describe('Repository', () => {
    it('should be able to perform basic operations', async () => {
        let repo = new FooRepository();

        //wait for initialize
        await repo.init;

        //create record
        let foo1: IFoo = { _id: 'a', name: 'A' };
        await repo.save(foo1);
        expect(foo1._rev).is.not.undefined;

        //update record
        foo1 = { _id: 'a', name: 'B' };
        await repo.save(foo1);

        //get record
        foo1 = await repo.get('a');
        expect(foo1.name).equals('B');

        //add more
        let foos: IFoo[] = [
            { _id: 'a', name: 'A' },
            { _id: 'b', name: 'B' }
        ];
        await repo.saveAll(foos);

        //get all
        foos = await repo.query();
        expect(foos[0].name).equals('A');
        expect(foos[1].name).equals('B');

        //query
        foos = await repo.query({
            selector: {
                name: { $gte: 'B' }
            }
        });
        expect(foos.length).equals(1);
        expect(foos[0].name).equals('B');

        //remove record
        await repo.remove(foo1);
        expect(foo1._deleted).is.true;

        //get not found
        foo1 = await repo.get('a');
        expect(foo1).is.undefined;

        //remove all
        foos = await repo.query();
        await repo.removeAll(foos);
        foos = await repo.query();
        expect(foos.length).equals(0);
    });
});

interface IFoo {
    _id: string;
    name: string;
    _rev?: string;
    _deleted?: boolean;
}

class FooRepository extends Repository<IFoo> {
    constructor() {
        super('foo', { adapter: 'memory' });

        this.init = this.init.then(() =>
            this.db.createIndex({
                index: { fields: ['name'] }
            }));
    }
}
