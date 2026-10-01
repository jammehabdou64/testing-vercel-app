# Pagination

`paginate(perPage, page)` runs the query twice: a count, then a page of rows. The default page size is 15. The default page is 1. `simplePaginate` skips the count and reports `hasMore`. `cursorPaginate(perPage, cursor)` reads the next page after an id.

```typescript
const page = await User.query().where("active", 1).paginate(15, 1);
const rows = await db.table("users").orderBy("id").paginate(50, 2);
```

`forPage(page, perPage)` only sets `limit` and `offset`. It does not count, and it does not return a paginator. Use it when you already know the page and do not want the total.

The paginator type is `Paginator<T>`, exported from `Core/JCC-Eloquent`. It carries the rows for that page and the numbers `paginate` computed from the count.

```typescript
const result = await User.query().latest().paginate(20, Number(request.input("page") ?? 1));
```

Pass the page from the request explicitly. The builder does not read the query string by itself.
