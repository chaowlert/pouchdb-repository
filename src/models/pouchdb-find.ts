declare let find: any;
declare module 'pouchdb-find' {
    export = find;
}

declare module pouchdb {
    module api {
        module methods {
            module createIndex {
                interface Options {
                    index: {
                        fields: string[];
                        name?: string;
                        ddoc?: string;
                        type?: 'json'
                    }
                }
                interface Response {
                    result: 'created' | 'exists';
                }
            }
            module getIndexes {
                interface Index {
                    ddoc: string;
                    name: string;
                    type: 'json' | 'special';
                    def: {
                        fields: { [key: string]: 'asc' | 'desc' }[]
                    }
                }
                interface Response {
                    indexes: Index[];
                }
            }
            module find {
                type Primitive = string | number | boolean;
                type Selectors = SelectorClass | SelectorOperator;
                interface SelectorClass {
                    [key: string]: Selector | Primitive;
                }
                interface SelectorOperator {
                    $and?: Selectors[];
                    $or?: Selectors[];
                    $nor?: Selectors[];
                    $not: Selectors;
                }
                interface Selector {
                    $lt?: Primitive;
                    $gt?: Primitive;
                    $lte?: Primitive;
                    $gte?: Primitive;
                    $eq?: Primitive;
                    $ne?: Primitive;
                    $exists?: boolean;
                    $type?: 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object';
                    $in?: Primitive[];
                    $nin?: Primitive[];
                    $all?: Primitive[];
                    $size?: number;
                    $regex?: string | RegExp;
                    $mod?: [number, number];
                    $elemMatch?: Selector;
                }
                interface Options {
                    selector?: Selectors,
                    fields?: string[];
                    sort?: string[];
                    limit?: number;
                    skip?: number;
                }
            }
        }
        module db {
            interface Promisable {
                createIndex(options: methods.createIndex.Options, callback: async.Callback<methods.createIndex.Response>): void;
                createIndex(options: methods.createIndex.Options): async.PouchPromise<methods.createIndex.Response>;
                getIndexes(callback: async.Callback<methods.getIndexes.Response>): void;
                getIndexes(): async.PouchPromise<methods.getIndexes.Response>;
                deleteIndex(index: methods.getIndexes.Index, callback: async.Callback<methods.createIndex.Response>): void;
                deleteIndex(index: methods.getIndexes.Index): async.PouchPromise<methods.createIndex.Response>;
                find(options: methods.find.Options, callback: async.Callback<methods.bulkDocs.DocumentPouch<methods.bulkDocs.MixedDoc>>): void;
                find(options: methods.find.Options): async.PouchPromise<methods.bulkDocs.DocumentPouch<methods.bulkDocs.MixedDoc>>;
            }
        }
    }
}
