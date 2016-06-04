# pouchdb-repository
Simple repository for PouchDb

## Install

```
npm install pouchdb-repository --save
```

## Getting started

This library is designed to use with Typescript. For example, you have a model called `Foo`.

```
interface Foo {
    _id: string;
    name: string;
}
```

You can create `FooRepository` by overriding `Repository`

```
class FooRepository extends Repository<Foo> {
  constructor() {
    super('foo');
  }
}

let repo = new FooRepository();
```

### Operations

#### Insert or update (Upsert)

You can insert of update by `save` method.

```
repo.save({ _id: 'foo1', name: 'bar' });
```

If id is found in database, record will be updated, otherwise it will be inserted.

#### Get one

You can get item by passing the id.

```
let foo = await repo.get('foo1');
```

Type you get from this repo will always be `Foo`.

#### Remove

```
repo.remove(foo);
```

An object will be removed from db.

#### Save all

```
repo.saveAll([foo1, foo2]);
```

All objects will perform upsert operation.

#### Remove all

```
repo.removeAll([foo1, foo2]);
```

All specified objects will be removed from db.

#### Query

`Query` options is from [pouchdb-find](https://github.com/nolanlawson/pouchdb-find). This library provides typing definition.

```
let results = await repo.query({
  selector: { name: 'Mario' }
});
```
