# Diplomatic Personnel Management System - Development Rules

You are building a production-ready **Diplomatic Personnel Management System** using my custom **Bun + TypeScript framework**.

The system requirements document is the primary functional source of truth:

`The System Requirement.docx`

Before implementing anything, read and understand the complete requirements document.

Also read the framework documentation before writing application code:

`documentation`

Do NOT assume this framework works like Express, Laravel, NestJS, or another framework. Use the APIs, conventions, lifecycle, dependency injection, routing, middleware, ORM, validation, responses, authentication, migrations, events, queues, and CLI provided by my framework.

---

# 1. Core Development Rules

## Framework

This application MUST use my new Bun framework.

Do not introduce:

- Express
- Fastify
- Hono
- NestJS
- Laravel
- Next.js
- another HTTP framework
- another ORM when the framework ORM is available

Use the framework's native:

- Router
- Controller
- Action/DI system
- Middleware
- Request
- Response
- Service Container
- Service Providers
- ORM
- Models
- Form Requests / validation
- migrations
- seeders
- authentication
- authorization
- events
- notifications
- queues
- file storage
- mail
- CLI

Only introduce an external package when the framework does not provide the required capability and there is a clear technical reason.

---

# 2. IMPORTANT FILE RULE

NEVER put multiple unrelated classes into the same file.

One major class/interface/enum should normally have its own file.

For example:

GOOD:

```
app/
├── Models/
│   ├── Personnel.ts
│   ├── Dependent.ts
│   ├── Mission.ts
│   └── Posting.ts
```

BAD:

```
app/Models/Personnel.ts

class Personnel {}
class Dependent {}
class Mission {}
class Posting {}
```

Do not combine controllers, models, services, requests, policies, or unrelated classes into one file simply to reduce the number of files.

Keep the project modular.

---

# 3. Do Not Invent Architecture

Before creating a new architectural pattern, inspect the framework documentation and existing project structure.

Reuse existing framework conventions.

Do not create duplicate abstractions when the framework already provides them.

For example:

If the framework already provides:

```
Controller
FormRequest
Model
Middleware
ServiceProvider
Policy
Event
Listener
Notification
```

use those instead of creating custom alternatives.

---

# 4. Read Before Coding

Before writing code:

1. Read the complete requirements document.
2. Read the framework documentation.
3. Inspect the existing application structure.
4. Inspect existing models, controllers, providers, middleware and configuration.
5. Determine how the framework expects:
   - routes
   - controllers
   - dependency injection
   - actions
   - models
   - migrations
   - validation
   - authentication
   - authorization
   - responses
   - file uploads
   - notifications
   - PDF generation
   - queues
   - testing

Do not guess.

---

# 5. Requirements Analysis

The system contains these primary functional areas:

1. Personnel Records
2. Posting Management
3. Leave Application
4. Vacation / Travel / Out of Office Notification
5. Transmission of Correspondence
6. Foreign Diplomatic Missions in The Gambia

The requirements also define role-based access control.

Primary roles include:

- Administrator
- Foreign Service Officer
- Honorable Minister
- Permanent Secretary
- Mission / Post User

The complete permissions matrix must be explicitly implemented rather than relying only on UI hiding.

Authorization MUST also be enforced on the backend.

---

# 6. Data Architecture

Before implementing business logic, design the database properly.

At minimum, evaluate and model these entities:

## Personnel

Possible fields include:

- id
- employee/service number
- full name
- date of birth
- nationality
- gender
- marital status
- national ID
- passport number
- passport issue date
- passport expiry date
- email
- phone
- address
- photograph
- designation
- department/directorate
- employment/appointment date
- employment status
- next of kin
- emergency contact
- created_at
- updated_at

Only add fields that are justified by the requirements or approved system design.

---

## Dependents

Dependents must NOT be stored as an unstructured text field.

Use a relationship.

Possible fields:

- id
- personnel_id
- name
- relationship
- date of birth
- gender
- nationality
- passport number
- contact details
- accompanying officer
- created_at
- updated_at

---

## Missions / Posts

Model Home/HQ and foreign missions properly.

Possible data:

- id
- name
- country
- city
- mission type
- physical address
- postal address
- official email
- official phone
- website
- head of mission
- status
- created_at
- updated_at

Mission types should be configurable rather than hard-coded where appropriate.

---

# 7. Posting Management

Posting history is important.

Do NOT store only:

```
personnel.current_posting_id
```

and discard historical data.

Create a proper posting history.

A posting record should track:

- personnel
- mission/post
- designation at posting
- start date
- expected end date
- actual end date
- posting status
- posting/reference number
- notes
- created_by
- created_at
- updated_at

The system must:

- maintain current staff per mission
- maintain historical staff
- calculate posting duration
- automatically close the previous posting when reassignment occurs
- preserve historical records

Never delete historical posting information simply because an officer was reassigned.

---

# 8. Leave Management

Implement the leave workflow described by the requirements.

Leave application should include:

- application/reference number
- officer
- leave type
- start date
- end date
- requested days
- status
- reason
- submitted date
- reviewed by
- reviewed date
- approval/rejection comments
- due-back date
- actual return date
- supporting documents where applicable

Workflow:

```
Draft
  ↓
Pending
  ↓
Approved
  ↓
Completed
```

or:

```
Pending
  ↓
Rejected
```

The Permanent Secretary must be able to approve/reject according to the requirements.

Prevent duplicate pending applications where required.

Do not allow ordinary users to modify approval results.

Every important state transition should be auditable.

---

# 9. Vacation / Travel Notification

Implement the vacation/travel notification separately from Leave.

It should support:

- officer
- designation
- travelling country
- destination city
- reason
- travel start date
- expected return date
- actual return date
- submission date
- status
- contact information while away
- supporting documents where applicable

Do not treat vacation notification as simply another leave record unless the requirements explicitly require that behavior.

---

# 10. Correspondence Management

Correspondence is an official communication system between:

- Home
- Missions
- Missions and other Missions

Support:

- From
- To
- Received From
- subject
- body
- date
- reference number
- sender
- recipient
- status
- PDF document
- attachments
- created by
- received by
- timestamps

Correspondence MUST be generated in PDF format according to the requirements.

Maintain separate concepts for:

- outgoing correspondence
- incoming correspondence

Maintain a searchable correspondence log.

Support downloading and printing PDFs.

Do not store only the letter body. The system needs proper metadata and document tracking.

---

# 11. Foreign Diplomatic Missions

Implement two related concepts:

## Foreign Diplomatic Mission

Store:

- mission name
- country
- mission type
- address
- city
- email
- phone
- website
- head of mission
- accreditation/status information

## Foreign Diplomatic Staff

Store:

- name
- nationality
- contact information
- passport number
- photograph
- dependents
- country represented
- mission
- designation/diplomatic rank
- accreditation start date
- accreditation end date
- status

Foreign diplomatic records can only be created by Administrators.

---

# 12. Users and Access Control

Implement proper user accounts.

A user should be associated with the relevant personnel record and, where applicable, mission/post.

Support:

- authentication
- password management
- account status
- role
- mission/post assignment
- personnel association
- last login
- timestamps

Roles:

```
Administrator
Foreign Service Officer
Honorable Minister
Permanent Secretary
Mission/Post User
```

Create explicit authorization rules for each module.

Do not rely on frontend checks.

Example:

A Foreign Service Officer must NOT be able to bypass the UI and directly create a personnel record through the API.

---

# 13. Audit Logging

Because this is a personnel/government administrative system, important actions should be auditable.

Create an audit system capable of recording:

- user
- action
- module
- entity
- entity ID
- previous values
- new values
- IP address
- timestamp

Important events include:

- personnel created
- personnel updated
- posting created
- posting reassigned
- leave submitted
- leave approved
- leave rejected
- correspondence sent
- correspondence received
- diplomatic staff created
- diplomatic mission created
- user/role changes

Do not log passwords or sensitive authentication secrets.

---

# 14. Reference Data

Do not hard-code everything.

Consider proper reference tables/configuration for:

- countries
- mission types
- designations/ranks
- leave types
- departments
- employment statuses
- posting statuses
- correspondence types
- correspondence statuses
- diplomatic ranks

Seed sensible initial data.

---

# 15. File Management

The system will contain:

- photographs
- passport-related documents
- supporting leave documents
- correspondence PDFs
- correspondence attachments
- other official documents

Use the framework's native file-storage/upload system where available.

Do not store uploaded binary files directly in database fields unless the framework specifically recommends it.

Store metadata and references to the files.

Validate:

- file type
- file size
- filename
- upload authorization

---

# 16. Search and Filtering

Search must be server-side.

Support filtering where required by the specification.

Personnel:

- name
- designation
- posting

Foreign diplomatic registry:

- country
- mission name

Correspondence:

- reference number
- subject
- from
- to
- date
- status

Leave:

- officer
- leave type
- status
- date range

Posting:

- officer
- mission
- current/historical
- date range

Use pagination for large datasets.

---

# 17. API Design

Design RESTful APIs following the conventions of my framework.

Example structure:

```
GET    /api/personnel
POST   /api/personnel
GET    /api/personnel/:id
PUT    /api/personnel/:id
DELETE /api/personnel/:id

GET    /api/personnel/:id/postings
POST   /api/personnel/:id/postings

GET    /api/leave
POST   /api/leave
GET    /api/leave/:id
POST   /api/leave/:id/approve
POST   /api/leave/:id/reject

GET    /api/vacation-notifications
POST   /api/vacation-notifications

GET    /api/correspondence
POST   /api/correspondence
GET    /api/correspondence/:id
GET    /api/correspondence/:id/pdf

GET    /api/missions
POST   /api/missions

GET    /api/diplomatic-staff
POST   /api/diplomatic-staff
```

Do not blindly copy these routes.

Adapt them to the framework's routing conventions.

---

# 18. Controllers

Controllers should remain thin.

Controllers should primarily:

- receive the request
- validate through FormRequest/validation
- authorize
- call application/service logic
- return the appropriate Response

Do NOT put large business workflows directly inside controllers.

Bad:

```ts
class LeaveController {
  async approve() {
    // 300 lines of business logic
  }
}
```

Prefer dedicated services/actions when the framework architecture supports them.

---

# 19. Services / Business Logic

Business logic should be reusable and testable.

Examples:

```
PersonnelService
PostingService
LeaveService
VacationNotificationService
CorrespondenceService
DiplomaticMissionService
DiplomaticStaffService
```

Do not create a service merely to wrap one line of ORM code.

Create services where actual domain/application logic exists.

---

# 20. Validation

Every user-controlled input must be validated.

Use the framework's FormRequest/validation system.

Examples:

- dates
- passport numbers
- email addresses
- phone numbers
- foreign keys
- file uploads
- status transitions

Never trust client-side validation.

---

# 21. Database Integrity

Use foreign keys and appropriate indexes.

Important indexes include:

- personnel service number
- passport number where appropriate
- personnel name/search fields where supported
- posting personnel_id
- posting mission_id
- posting dates
- leave personnel_id
- leave status
- correspondence reference number
- correspondence sender/receiver
- diplomatic mission country
- diplomatic staff mission_id

Use transactions for operations such as officer reassignment.

For example:

```
begin transaction

close previous posting

create new posting

update current posting

commit
```

If anything fails, rollback the entire operation.

---

# 22. Authorization

Authorization must happen server-side.

Examples:

Administrator:

- create personnel
- update personnel
- manage missions
- manage diplomatic records
- manage users
- manage reference data

Foreign Service Officer:

- view own personnel record
- submit leave
- submit vacation/travel notification
- create/send correspondence according to permissions

Permanent Secretary:

- review leave
- approve/reject leave
- view permitted reports/postings

Mission/Post User:

- manage permitted mission correspondence
- view permitted mission information

Do not assume that role names alone are sufficient. Implement actual permission checks.

---

# 23. Transactions and State Changes

Critical workflows must be atomic.

Examples:

Officer reassignment:

```
old posting -> closed
new posting -> created
current posting -> updated
```

Leave approval:

```
application -> approved
review information -> recorded
notification -> queued
```

If one critical operation fails, the database should not be left in a partially updated state.

---

# 24. Notifications

Use the framework's notification/event/queue capabilities if available.

Examples:

- leave submitted
- leave approved
- leave rejected
- posting reassigned
- correspondence received

Do not make the HTTP request unnecessarily slow when a task can safely be queued.

---

# 25. PDF Generation

PDF generation should be isolated behind a reusable service.

Example:

```
PdfService
```

Do not duplicate PDF generation code across controllers.

Use templates where appropriate.

Generated PDFs should have:

- official document metadata
- reference number
- date
- sender
- recipient
- subject
- body
- appropriate formatting

---

# 26. Dashboard

Create role-aware dashboards.

Administrator dashboard:

- total personnel
- personnel by posting
- mission statistics
- pending leave applications
- recent correspondence
- diplomatic mission statistics
- recent activity

Foreign Service Officer:

- own profile
- current posting
- leave status
- upcoming leave
- vacation/travel notifications
- correspondence

Permanent Secretary:

- pending leave approvals
- posting overview
- reports
- relevant personnel information

Mission/Post User:

- mission staff
- incoming correspondence
- outgoing correspondence
- mission information

Do not expose information to users who are not authorized to see it.

---

# 27. Testing

Write tests as features are implemented.

At minimum test:

## Personnel

- Administrator can create personnel
- non-Administrator cannot create personnel
- Administrator can update personnel
- authorized users can search personnel

## Posting

- officer can be assigned to a mission
- reassignment closes previous posting
- posting history remains intact
- duration calculation works

## Leave

- officer can submit leave
- application becomes Pending
- PS can approve
- PS can reject
- unauthorized user cannot approve
- pending duplicate application is prevented

## Vacation

- authorized officer can submit
- required information is validated
- unauthorized users cannot manipulate another officer's records

## Correspondence

- authorized users can create correspondence
- PDF is generated
- incoming correspondence is recorded
- unauthorized users cannot access restricted correspondence

## Diplomatic missions

- only Administrator can create records
- searching works
- mission/staff relationships work

## Authorization

Test authorization independently from UI.

---

# 28. Implementation Order

Do NOT attempt to build the entire system in one pass.

Implement in this order:

### Phase 1 - Foundation

- project configuration
- database
- authentication
- users
- roles
- permissions
- audit logging
- reference data

### Phase 2 - Personnel

- personnel model
- dependents
- personnel CRUD
- search
- authorization
- photograph/document handling

### Phase 3 - Missions and Postings

- missions
- posting records
- current roster
- historical roster
- reassignment workflow
- duration calculation

### Phase 4 - Leave

- leave types
- leave applications
- validation
- approval workflow
- rejection workflow
- notifications
- leave history

### Phase 5 - Vacation/Travel

- travel notifications
- dates
- destination
- reason
- status
- notifications

### Phase 6 - Correspondence

- correspondence
- incoming/outgoing
- PDF generation
- attachments
- reference numbers
- search
- access control

### Phase 7 - Foreign Diplomatic Registry

- foreign missions
- diplomatic staff
- dependents
- accreditation
- search
- PDF export

### Phase 8 - Reports/Dashboard

- dashboards
- reports
- exports
- statistics

### Phase 9 - Hardening

- authorization audit
- validation audit
- database indexes
- performance
- security
- tests
- error handling
- logging

---

# 29. Migration Rules

Every database change must use migrations.

Do not manually modify production database structure.

Migrations should:

- have clear names
- define foreign keys
- define indexes
- define nullable fields intentionally
- define timestamps
- support rollback where practical

---

# 30. Seeder Rules

Create seeders for:

- administrator account
- roles
- permissions
- countries
- mission types
- leave types
- designations
- initial reference data

Do not put production passwords directly into committed seeders.

Use environment configuration for sensitive credentials.

---

# 31. Security

Treat this as a sensitive personnel-management application.

Implement:

- authentication
- authorization
- CSRF protection where applicable
- input validation
- secure password hashing
- secure file uploads
- access control on downloads
- audit logging
- rate limiting where appropriate
- secure session/token handling
- no sensitive data in logs
- no passwords in source code
- no secrets committed to Git

Do not expose private personnel information through unrestricted API responses.

---

# 32. Code Quality

Use strict TypeScript.

Avoid:

```ts
any;
```

unless there is a legitimate framework boundary where it is unavoidable.

Prefer:

```ts
interface
type
generic types
unknown
```

with proper validation/narrowing.

Use clear naming.

Avoid unnecessarily clever abstractions.

Prefer simple, readable code.

---

# 33. Framework-Specific Rules

My framework uses a Laravel-inspired architecture but runs on Bun.

That does NOT mean you should copy Laravel code directly.

Use the framework's actual APIs.

For example, if the framework provides:

```ts
Route.get(...)
```

use it.

If controllers use:

```ts
export class UserController {
    ...
}
```

follow that pattern.

If dependency injection uses:

```ts
@Inject()
```

and controller method resolution uses:

```ts
@Action()
```

use those conventions.

Do not introduce another dependency injection library.

Do not create another router.

Do not create another ORM layer.

Do not recreate framework features that already exist.

---

# 34. Before Each Implementation

Before implementing a feature:

1. Identify the relevant requirement IDs.
2. Identify required database entities.
3. Identify relationships.
4. Identify authorization rules.
5. Identify validation rules.
6. Identify workflow/state transitions.
7. Identify audit requirements.
8. Check existing framework functionality.
9. Implement migration/model first.
10. Implement validation.
11. Implement service/business logic.
12. Implement controller.
13. Implement routes.
14. Implement authorization.
15. Implement tests.

---

# 35. Requirement Traceability

Every major feature should reference the requirement IDs it implements.

For example:

```ts
/**
 * Implements:
 * LV-01
 * LV-02
 * LV-03
 */
```

Do not add requirement IDs that do not exist in the specification.

If a feature is an enhancement rather than an explicit requirement, clearly identify it as an application design decision.

---

# 36. Handling Missing Requirements

The requirements document has areas where important data or behavior is not fully specified.

Do NOT silently invent critical business rules.

When you encounter an ambiguity:

1. Identify it.
2. Check whether another part of the specification resolves it.
3. If not, record it as an open design decision.
4. Choose a conservative implementation only when necessary.
5. Keep the implementation easy to change.

Examples of decisions that may require clarification:

- exact leave types
- leave entitlement/balance rules
- mission types
- diplomatic accreditation rules
- correspondence confidentiality levels
- document retention
- user permission granularity
- reporting requirements

Do not pretend these were specified if they were not.

---

# 37. Development Discipline

Do not generate huge amounts of code without checking the existing project.

After each major phase:

- run TypeScript checks
- run tests
- run migrations
- verify relationships
- verify authorization
- inspect generated files
- fix errors before moving forward

Never leave the project in a knowingly broken state before moving to another module.

---

# 38. Final Goal

The final application should be:

- modular
- maintainable
- secure
- strongly typed
- testable
- auditable
- role-based
- database-integrity-safe
- optimized for Bun
- built around my framework's native architecture

Most importantly:

**Build the system using my framework, not around my framework.**

Do not fight the framework.

Do not replace its architecture.

Do not introduce Express-style patterns simply because they are familiar.

Use the framework documentation and existing source code as the technical authority, and use `The System Requirement.docx` as the functional authority.
