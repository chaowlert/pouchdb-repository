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
                putAttachment(docId: string, attachmentId: string, rev: string, attachment: AttachmentData, type: string, callback: async.Callback<methods.OperationResponse>): void;
                putAttachment(docId: string, attachmentId: string, attachment: AttachmentData, type: string, callback: async.Callback<methods.OperationResponse>): void;
                putAttachment(docId: string, attachmentId: string, rev: string, attachment: AttachmentData, type: string): async.PouchPromise<methods.OperationResponse>;
                putAttachment(docId: string, attachmentId: string, attachment: AttachmentData, type: string): async.PouchPromise<methods.OperationResponse>;
                getAttachment(docId: string, attachmentId: string, options: methods.remove.RevOptions, callback: async.Callback<Blob>): void;
                getAttachment(docId: string, attachmentId: string, options?: methods.remove.RevOptions): async.PouchPromise<Blob>;
                removeAttachment(docId: string, attachmentId: string, rev: string, callback: async.Callback<methods.OperationResponse>): void;
                removeAttachment(docId: string, attachmentId: string, rev: string): async.PouchPromise<methods.OperationResponse>;
            }
        }
        module methods {
            module get {
                interface Options {
                    binary?: boolean;
                }
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
    }
}
