# Transactions

A connection runs a callback inside a transaction. Throw, or reject, and the connection rolls back. Return, and it commits.

```typescript
const connection = db.connection();

await connection.transaction(async () => {
  await connection.table("accounts").where("id", from).update({ balance: nextFrom });
  await connection.table("accounts").where("id", to).update({ balance: nextTo });
});
```

Nested `transaction` calls use a savepoint when the driver supports it. The outer callback still decides the final commit.

Models opened on that connection see the same transaction. Do not open a second connection inside the callback if those writes must roll back together.

The query builder has no separate `transaction` method. Always go through the connection.
