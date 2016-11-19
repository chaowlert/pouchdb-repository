declare module pouchdb {
    module options {
        module ctor {
            interface CustomDb {
                [key: string]: any;
            }
        }
    }
    module api {
        module db {
            interface Promisable {
                putAttachment(docId: string, attachmentId: string, rev: string, attachment: AttachmentData, type: string): async.PouchPromise<methods.OperationResponse>;
                putAttachment(docId: string, attachmentId: string, attachment: AttachmentData, type: string): async.PouchPromise<methods.OperationResponse>;
                getAttachment(docId: string, attachmentId: string, options?: methods.remove.RevOptions): async.PouchPromise<Blob>;
                removeAttachment(docId: string, attachmentId: string, rev: string): async.PouchPromise<methods.OperationResponse>;
                viewCleanup(): async.PouchPromise<methods.OperationResponse>;
                compact(options?: methods.compact.Options): async.PouchPromise<methods.OperationResponse>;
                revsDiff(diff: any): async.PouchPromise<methods.OperationResponse>;
                bulkGet<R extends methods.ExistingDoc>(options?: methods.bulkGet.Options): async.PouchPromise<methods.bulkGet.Response<R>>;
            }
            interface Callback {
                putAttachment(docId: string, attachmentId: string, rev: string, attachment: AttachmentData, type: string, callback: async.Callback<methods.OperationResponse>): void;
                putAttachment(docId: string, attachmentId: string, attachment: AttachmentData, type: string, callback: async.Callback<methods.OperationResponse>): void;
                getAttachment(docId: string, attachmentId: string, options: methods.remove.RevOptions, callback: async.Callback<Blob>): void;
                removeAttachment(docId: string, attachmentId: string, rev: string, callback: async.Callback<methods.OperationResponse>): void;
                viewCleanup(callback: async.Callback<methods.OperationResponse>): void;
                compact(options: methods.compact.Options, callback: async.Callback<methods.OperationResponse>): void;
                revsDiff(diff: any, callback: async.Callback<methods.OperationResponse>): void;
                bulkGet<R extends methods.ExistingDoc>(options: methods.bulkGet.Options, callback: async.Callback<methods.bulkGet.Response<R>>): void;
            }
        }
        module methods {
            module get {
                interface Options {
                    binary?: boolean;
                }
            }
            module compact {
                interface Options {
                    interval?: number;
                }
            }
            module changes {
                interface AdvancedOptions {
                    heartbeat?: number;
                }
            }
            module replicate {
                interface ReplicateOptions extends changes.FilterOptions, changes.AdvancedOptions { 
                    timeout?: number;
                    batches_limit?: number;
                    back_off_function?: (delay: number) => number;
                }
            }
            module query {
                interface QueryOptions extends allDocs.PaginationOptions, allDocs.FilterOptions {
                    group?: boolean;
                    group_level?: number;
                    stale?: string;
                }
            }
            module bulkGet {
                interface DocsOptions {
                    id: string;
                    rev?: string;
                    atts_since?: string;
                }
                interface Options {
                    docs: DocsOptions[];
                    revs?: boolean;
                    attachments?: boolean;
                    binary?: boolean;
                }
                interface Response<R extends methods.ExistingDoc> {
                    results: DocsResponse<R>[];
                }
                interface DocsResponse<R extends methods.ExistingDoc> {
                    docs: DocResponse<R>[];
                    id: string;
                }
                interface DocResponse<R extends methods.ExistingDoc> {
                    ok: R;
                    error: {
                        error: string;
                        id: string;
                        reason: string;
                        rev: string;
                    }
                }
            }
            interface BasePaginationOptions {
                binary?: boolean;
            }
        }
    }

    type AttachmentData = any;

    interface Attachment {
        content_type: string;
        data: AttachmentData;
    }

    interface PouchDB {
        plugin(plugin: any): void;
        replicate(source: string, target: string, options?: api.methods.replicate.ReplicateOptions): async.PouchPromise<api.methods.Response>;
        on(eventName: string, callback: (dbName: string) => void): void;
        defaults(options: any): PouchDB;
        debug: {
            enable(name: string): void;
            disable(): void;
        };
    }
}
