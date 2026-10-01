# Views

Views are HTML files in `resources/views`. The `View` facade renders them. `users.index` reads `resources/views/users/index.html`.

```typescript
import { View } from "../../../Core/Support/Facades/View";

return View.render("users.index", { users });
```

From a response:

```typescript
return res.view("users.index", { users });
```

The engine is `Core/View/ViewEngine.ts`. It is not Blade. The directives below are the ones it implements.

---

## Echo

```html
<p>{{ user.name }}</p>
<div>{!! html !!}</div>
```

`{{ }}` is escaped with `Escaper.html`. `{!! !!}` is raw. Keys are dotted paths into the data object. See [Requests](../Security/Requests.md).

---

## Layouts

```html
@extends('layouts.app')

@section('content')
  <h1>{{ title }}</h1>
@endsection
```

The layout yields the section:

```html
<main>
  @yield('content')
</main>
```

`@include('partials.nav')` inserts another template. Includes are interpolated with the same data.

---

## Conditionals and loops

```html
@if(user)
  <p>{{ user.name }}</p>
@else
  <p>Guest</p>
@endif

@foreach(users as user)
  <li>{{ user.name }}</li>
@endforeach
```

`@if` evaluates the expression as JavaScript against the view data. `@foreach` exposes `$loop.index`, `$loop.first`, and `$loop.last`.

---

## Forms and assets

```html
<form method="post" action="/users">
  @csrf
</form>
```

`@csrf` needs a request in context, because the token comes from `request.session().token()`.

`@vite(['resources/js/app.tsx'])` emits the dev or production asset tags. `@inertia` and `@inertiaHead` belong to the Inertia root view. See [Asset bundling](./Asset-bundling.md) and [Inertia](./Inertia.md).
