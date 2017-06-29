import * as PouchDB from 'pouchdb-core';
import * as find from 'pouchdb-find';

PouchDB.plugin(find);

export type PouchEntity = { _id: string, _rev?: string, _deleted?: boolean };
type ErrorResponse = { status?: number, error?: boolean, doc?: any };

export class Repository<T extends PouchEntity> {
    db: PouchDB.Database<T>;
    init: Promise<any>;

    constructor(name: string, options: PouchDB.Configuration.LocalDatabaseConfiguration = {}) {
        //default is auto compact
        if (options.auto_compaction == null) {
            options.auto_compaction = true;
        }

        this.db = new PouchDB(options.name || name, options);
        this.init = this.db.info();
    }

    async save(item: T) {
        try {
            let result = await this.db.put(item);
            item._id = result.id;
            item._rev = result.rev;
        } catch (e) {
            if (e.status !== 409) {
                throw e;
            }
            let old = await this.db.allDocs({ key: item._id });
            item._rev = old.rows[0].value.rev;
            let result = await this.db.put(item);
            item._rev = result.rev;
        }
    }

    async get(id: string, options: PouchDB.Core.GetOptions = {}): Promise<T> {
        try {
            let result = await this.db.get(id, options);
            return result;
        } catch (e) {
            return undefined;
        }
    }

    remove(item: T) {
        item._deleted = true;
        return this.save(item);
    }

    private async _saveAll(items: T[]) {
        //bulk update
        let results: (PouchDB.Core.Response | ErrorResponse)[] = await this.db.bulkDocs(items);

        //update rev & get conflicted indexes
        let retryIndexes: number[] = [];
        let errors: ErrorResponse[] = [];
        for (let i = 0; i < items.length; i++) {
            let result = results[i];
            let item = items[i];
            if (isError(result)) {
                if (result.status !== 409) {
                    result.doc = item;
                    errors.push(result);
                } else {
                    retryIndexes.push(i);
                }
            } else {
                item._id = result.id;
                item._rev = result.rev;
            }
        }

        //retry
        if (retryIndexes.length) {
            let retryIds = retryIndexes.map(idx => items[idx]._id);
            let retryItems = retryIndexes.map(idx => items[idx]);
            let old = await this.db.allDocs({ keys: retryIds });
            for (let i = 0; i < retryItems.length; i++) {
                retryItems[i]._rev = old.rows[i].value.rev;
            }
            let retryResults: PouchDB.Core.Response[] | ErrorResponse[] = await this.db.bulkDocs(retryItems);
            for (let i = 0; i < retryItems.length; i++) {
                let result = retryResults[i];
                let item = retryItems[i];
                let index = retryIndexes[i];
                results[index] = result;
                if (isError(result)) {
                    result.doc = item;
                    errors.push(result);
                } else {
                    item._rev = result.rev;
                }
            }
        }

        return errors;

        function isError(obj: ErrorResponse): obj is ErrorResponse {
            return obj.error;
        }
    }

    saveAllChunkSize = 500;
    async saveAll(items: T[]) {
        let errors: ErrorResponse[] = [];
        for (let i = 0; i < items.length; i += this.saveAllChunkSize) {
            let chunk = items.slice(i, i + this.saveAllChunkSize);
            let chunkErrors = await this._saveAll(chunk);
            errors.push(...chunkErrors);
        }
        if (errors.length) {
            throw errors;
        }
    }

    removeAll(items: T[]) {
        for (let item of items) {
            item._deleted = true;
        }
        return this.saveAll(items);
    }

    async query(options: PouchDB.Find.FindRequest<T> = { selector: null }) {
        if (!options.selector) {
            options.selector = { _id: { $gte: '', $regex: '^(?!_design\/)' } };
        }
        let docs = await this.db.find(options);
        return docs.docs as T[];
    }
}
