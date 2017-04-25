import * as PouchDB from 'pouchdb-core';
import * as find from 'pouchdb-find';

PouchDB.plugin(find);

export class Repository<T extends PouchDB.Core.IdMeta> {
    db: PouchDB.Database<T>;
    init: Promise<any>;

    constructor(name: string, options: PouchDB.Configuration.DatabaseConfiguration = {}) {
        //default is auto compact
        if ((<any>options).auto_compaction == null) {
            (<any>options).auto_compaction = true;
        }

        this.db = new PouchDB(options.name || name, options);
        this.init = this.db.info();
    }

    async save(item: T) {
        try {
            let result = await this.db.put(item);
            item._id = result.id;
            (<any>item)._rev = result.rev;
        } catch (e) {
            if (e.status !== 409) {
                throw e;
            }
            let old = await this.db.allDocs({ key: item._id });
            (<any>item)._rev = old.rows[0].value.rev;
            let result = await this.db.put(item);
            (<any>item)._rev = result.rev;
        }
    }

    async get(id: string, options: PouchDB.Core.GetOptions = {}): Promise<T> {
        try {
            let result = await this.db.get(id, options);
            return <any>result;
        } catch (e) { 
            return undefined;
        }
    }

    remove(item: T) {
        (<any>item)._deleted = true;
        return this.save(item);
    }

    async saveAll(items: T[]) {
        //bulk update
        let results = await this.db.bulkDocs(items);

        //update rev & get conflicted indexes
        let retryIndexes: number[] = [];
        let hasError = false;
        for (let i = 0; i < items.length; i++) {
            let result = results[i];
            let item = items[i];
            if ((<any>result).error) {
                if ((<any>result).status !== 409) {
                    hasError = true;
                }
                retryIndexes.push(i);
            } else {
                item._id = result.id;
                (<any>item)._rev = result.rev;
            }
        }
        if (hasError) {
            throw results;
        }

        //retry
        if (retryIndexes.length) {
            let retryIds = retryIndexes.map(idx => items[idx]._id);
            let retryItems = retryIndexes.map(idx => items[idx]);
            let old = await this.db.allDocs({ keys: retryIds });
            for (let i = 0; i < retryItems.length; i++) {
                (<any>retryItems[i])._rev = old.rows[i].value.rev;
            }
            let retryResults = await this.db.bulkDocs(retryItems);
            for (let i = 0; i < retryItems.length; i++) {
                let result = retryResults[i];
                let item = retryItems[i];
                let index = retryIndexes[i];
                results[index] = result;
                if ((<any>result).error) {
                    hasError = true;
                } else {
                    (<any>item)._rev = result.rev;
                }
            }
            if (hasError) {
                throw results;
            }
        }
    }

    removeAll(items: T[]) {
        for (let item of items) {
            (<any>item)._deleted = true;
        }
        return this.saveAll(items);
    }

    async query(options: PouchDB.Find.FindRequest<T> = { selector: null }) {
        if (!options.selector) {
            options.selector = { _id: { $gte: '', $regex: '^(?!_design\/)' } };
        }
        let docs = await this.db.find(options);
        return <T[]>docs.docs;
    }
}
