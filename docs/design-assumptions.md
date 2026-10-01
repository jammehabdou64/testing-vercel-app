# Design assumptions

Locked schema choices are listed first. The rest are conservative defaults. A default is an assumption, not a requirement from the specification. Fields that are not listed in the specification are omitted until they are explicitly approved.

## Approved schema decisions

- Personnel contact details are nullable `email`, `phone`, and `address`. None of the three is required.
- Foreign diplomatic staff contact details are nullable `email` and `phone`. There is no address on the staff record.
- Each foreign diplomatic staff member belongs to exactly one foreign diplomatic mission (`foreign_diplomatic_mission_id` is required). A mission cannot be deleted while staff still point at it.
- A foreign diplomatic mission has a required `country` string, in addition to name, address, email, and phone.
- A personnel dependent stores `full_name` (required), `relationship` (required free text), and `date_of_birth` (optional). Passport, contact, and nationality are omitted. Relationship is not limited to spouse or child.

## Phase 1 schema

- `users.role_id` references `roles`. The column is nullable so the migration does not assign a role to accounts that already exist. The users table is rebuilt in that migration because SQLite cannot add a foreign key with `ALTER TABLE`.
- `users.mission_id` references Gambian `missions`. A mission cannot be deleted while a user points at it.
- `users.personnel_id` is a nullable indexed column and is not unique. Phase 1 does not create personnel. The Phase 2 users migration turns the column into a foreign key to `personnel.id` with `ON DELETE RESTRICT`.
- A user has no column that points at foreign diplomatic staff.
- The database cannot express “this role requires this link” as a foreign key. Those rules are enforced when account management is built: a Foreign Service Officer requires `personnel_id`, a Mission / Post User requires `mission_id` and has no `personnel_id`, and Administrator, Honorable Minister, and Permanent Secretary may leave `personnel_id` empty.
- One Home mission is seeded. There is no partial unique index that the schema builder can express for “only one Home”.

## Identity and access

- A user has one role. The roles are Administrator, Foreign Service Officer, Honorable Minister, Permanent Secretary, and Mission / Post User.
- A Foreign Service Officer login requires a Personnel link. A Mission / Post User login requires a Gambian Mission link and has no Personnel link. Administrator, Honorable Minister, and Permanent Secretary may have no Personnel link.
- There is no permissions table. Policies in application code enforce access.
- There is no public self-registration. An Administrator creates accounts.
- Email verification does not gate the application. Sign-in is enough.
- Accounts cannot be suspended. There is no `disabled_at` column until that is approved.
- There is no `last_login_at` column.
- An Administrator cannot delete a Personnel record. The specification forbids other roles from deleting one, and it never grants deletion to the Administrator.

## Authorization

Database constraints keep links and value lists valid. Policies decide who may act. A policy does not infer a role from a personnel or mission row, and it does not repeat a database check such as “the two correspondence missions differ.”

- Account links follow `AccountAssignmentRules`: a Foreign Service Officer has a personnel link and no mission login; a Mission / Post User has a mission link and no personnel link; Administrator, Honorable Minister, and Permanent Secretary may have a personnel link and must not have a mission login.
- Administrator creates and updates personnel, dependents, Gambian missions, and foreign diplomatic records, and reassigns postings. No role may delete personnel.
- A Foreign Service Officer views and acts only for their own personnel record: own personnel, own postings, own leave, and own vacation notifications.
- The Permanent Secretary may view and decide leave. The Honorable Minister may view leave and may not decide it. LV-04 names the Permanent Secretary as the decision maker.
- A vacation notification may be filed by a Foreign Service Officer and viewed by that officer or an Administrator.
- Correspondence may be composed or viewed by a Mission / Post User for their mission, or by a Foreign Service Officer for the mission of their single open posting. Home is that same rule when the viewer's mission is Home. Administrator, Honorable Minister, and Permanent Secretary are not correspondence parties.
- Foreign diplomatic export is granted to the Administrator through `ForeignDiplomaticMissionPolicy.export`. That check is separate from create and update. Search and export for every other role, personnel search for the Minister and Permanent Secretary, and mission rosters for those offices are not granted.

## HTTP routes

Web routes use the session guard. `GET /register` and `POST /register` are not registered. JSON API routes are not the personnel interface. `GET /api/health` remains the health check.

These account and personnel routes are the current application surface. Each one authorizes with the existing policy. There is no personnel delete route.

| Method and path | Controller | Who may pass the policy |
|---|---|---|
| `GET /accounts` | `AccountController.index` | Administrator |
| `GET /accounts/create` | `AccountController.create` | Administrator |
| `POST /accounts` | `AccountController.store` | Administrator, and `AccountAssignmentRules` allows the assignment |
| `GET /accounts/{user}/edit` | `AccountController.edit` | Administrator |
| `PUT /accounts/{user}` | `AccountController.update` | Administrator, and the new assignment is allowed |
| `GET /personnel` | `PersonnelController.index` | Administrator |
| `GET /personnel/create` | `PersonnelController.create` | Administrator |
| `POST /personnel` | `PersonnelController.store` | Administrator |
| `GET /personnel/{personnel}` | `PersonnelController.show` | Administrator, or the Foreign Service Officer linked to that record |
| `GET /personnel/{personnel}/edit` | `PersonnelController.edit` | Administrator |
| `PUT /personnel/{personnel}` | `PersonnelController.update` | Administrator |
| `POST /personnel/{personnel}/dependents` | `PersonnelDependentController.store` | Administrator |
| `PUT /personnel/{personnel}/dependents/{dependent}` | `PersonnelDependentController.update` | Administrator, and the dependent belongs to that personnel record |
| `DELETE /personnel/{personnel}/dependents/{dependent}` | `PersonnelDependentController.destroy` | Administrator, and the dependent belongs to that personnel record |
| `POST /personnel/{personnel}/photograph` | `PersonnelPhotographController.store` | Administrator. The bytes are passed to `PhotographService.replacePersonnel` |
| `GET /personnel/{personnel}/postings` | `PostingController.index` | Anyone who may view that personnel record |
| `POST /personnel/{personnel}/postings` | `PostingController.store` | Administrator. `PostingService.assign` performs the assignment |
| `GET /leave` | `LeaveController.index` | Honorable Minister, Permanent Secretary, or the Foreign Service Officer's own applications |
| `GET /leave/create` | `LeaveController.create` | Foreign Service Officer |
| `POST /leave` | `LeaveController.store` | Foreign Service Officer for their own personnel record. `LeaveService.submit` performs the submission |
| `POST /leave/{application}/approve` | `LeaveController.approve` | Permanent Secretary. `LeaveService.approve` performs the decision |
| `POST /leave/{application}/reject` | `LeaveController.reject` | Permanent Secretary. `LeaveService.reject` performs the decision |
| `GET /correspondence` | `CorrespondenceController.index` | A Mission / Post User or a Foreign Service Officer whose mission resolves. The list is `CorrespondenceService.visibleTo` |
| `GET /correspondence/create` | `CorrespondenceController.create` | That same actor, when `CorrespondenceService.canCompose` allows it |
| `POST /correspondence` | `CorrespondenceController.store` | That same actor. The form does not choose the sender. `CorrespondenceService.compose` writes the letter |
| `GET /correspondence/{correspondence}/pdf` | `CorrespondenceController.pdf` | An actor who can see that letter. The stored private file is downloaded |
| `GET /missions` | `MissionController.index` | Administrator |
| `GET /missions/create` | `MissionController.create` | Administrator |
| `POST /missions` | `MissionController.store` | Administrator |
| `GET /missions/{mission}/edit` | `MissionController.edit` | Administrator |
| `PUT /missions/{mission}` | `MissionController.update` | Administrator |
| `GET /vacation-notifications` | `VacationNotificationController.index` | Administrator, or the Foreign Service Officer's own notices. The list is `VacationNotificationService.visibleTo` |
| `GET /vacation-notifications/create` | `VacationNotificationController.create` | Foreign Service Officer |
| `POST /vacation-notifications` | `VacationNotificationController.store` | Foreign Service Officer. The form does not choose the personnel record. `VacationNotificationService.file` writes the notice |
| `GET /vacation-notifications/{notification}` | `VacationNotificationController.show` | The submitting officer or an Administrator |
| `GET /foreign-missions` | `ForeignDiplomaticMissionController.index` | Administrator |
| `GET /foreign-missions/create` | `ForeignDiplomaticMissionController.create` | Administrator |
| `POST /foreign-missions` | `ForeignDiplomaticMissionController.store` | Administrator |
| `GET /foreign-missions/{mission}/edit` | `ForeignDiplomaticMissionController.edit` | Administrator |
| `PUT /foreign-missions/{mission}` | `ForeignDiplomaticMissionController.update` | Administrator |
| `GET /foreign-missions/export` | `ForeignDirectoryExportController.show` | Administrator. `ForeignDirectoryExportService.exportDirectory` builds the PDF for this response |
| `GET /foreign-missions/{mission}/staff` | `ForeignDiplomaticStaffController.index` | Administrator |
| `GET /foreign-missions/{mission}/staff/create` | `ForeignDiplomaticStaffController.create` | Administrator |
| `POST /foreign-missions/{mission}/staff` | `ForeignDiplomaticStaffController.store` | Administrator. The mission comes from the URL |
| `GET /foreign-missions/{mission}/staff/{staff}` | `ForeignDiplomaticStaffController.show` | Administrator, and the staff member belongs to that mission |
| `GET /foreign-missions/{mission}/staff/{staff}/edit` | `ForeignDiplomaticStaffController.edit` | Administrator, and the staff member belongs to that mission |
| `PUT /foreign-missions/{mission}/staff/{staff}` | `ForeignDiplomaticStaffController.update` | Administrator, and the staff member belongs to that mission |
| `POST /foreign-missions/{mission}/staff/{staff}/photograph` | `ForeignDiplomaticStaffPhotographController.store` | Administrator. `PhotographService.replaceDiplomaticStaff` stores the file |
| `POST /foreign-missions/{mission}/staff/{staff}/dependents` | `ForeignDiplomaticDependentController.store` | Administrator, and the staff member belongs to that mission |
| `PUT /foreign-missions/{mission}/staff/{staff}/dependents/{dependent}` | `ForeignDiplomaticDependentController.update` | Administrator, and the dependent belongs to that staff member |
| `DELETE /foreign-missions/{mission}/staff/{staff}/dependents/{dependent}` | `ForeignDiplomaticDependentController.destroy` | Administrator, and the dependent belongs to that staff member |

A guest is redirected to `/login`. A signed-in user can open `/dashboard` without a verified email. Inertia page components for these screens are not built yet. The controllers already return those page names.

There is no mission delete route. Postings, correspondence, and Mission / Post User accounts reference `missions`, and the database restricts a delete while those rows exist.

The foreign diplomatic routes do not create a User or a Personnel record. Export does not store a file, write an audit row, or insert a registry row.

## Missions and postings

- A Gambian Mission stores a name and whether it is Home. Country, city, address, email, phone, website, and head of mission are omitted.
- Home is seeded as a Mission named "Home".
- The current posting is the Posting whose end date is empty. Personnel does not store `current_posting_id`.
- A Posting stores the officer, the mission, the start date, and the end date. Designation-at-post, expected end, reference number, notes, posting status, and `created_by` are omitted.
- Duration is calculated from the start date to the end date, or to the current date while the posting is open. It is not stored.
- At most one open posting per officer is enforced by posting logic later. The database does not add a partial unique index for that rule.
- Passport number is indexed and is not unique.

## Phase 3 schema

`postings` connects one Personnel record to one Gambian `missions` row. It does not reference `foreign_diplomatic_missions`.

| Column | Rule |
|---|---|
| `personnel_id` | Required foreign key to `personnel.id`. Deleting a personnel row is restricted while a posting points at it |
| `mission_id` | Required foreign key to `missions.id`. Deleting a mission is restricted while a posting points at it |
| `starts_on` | Required date |
| `ends_on` | Nullable date. Empty means this posting is the current posting |

Omitted from `postings` and from `personnel`: `current_posting_id`, `duration`, designation at post, expected end, reference number, notes, posting status, and `created_by`.

Assigning a posting is allowed only when `PostingPolicy.reassign` allows it. If the officer has one open posting, that row's `ends_on` becomes the calendar day before the new `starts_on`, and then the new open posting is inserted. If that end date would fall before the open posting's `starts_on`, the assignment is refused. If the officer already has more than one open posting, the assignment is refused. The close and the insert run in one transaction. Duration is calculated from `starts_on` to `ends_on`, or to the given day while the posting is open. It is not stored.

## Leave schema

`leave_applications` belongs to one Personnel record. It is not a posting and not a vacation notification.

| Column | Rule |
|---|---|
| `personnel_id` | Required foreign key to `personnel.id`. Deleting a personnel row is restricted while a leave application points at it |
| `leave_type` | Required. `casual` or `annual` only |
| `starts_on` | Required date |
| `ends_on` | Required date |
| `status` | Required. `pending`, `approved`, or `rejected`. New rows default to `pending` |

The officer's name and designation are read from the Personnel record when the application is shown. They are not copied onto the application.

The due-back date is the calendar day after `ends_on`. It is calculated when displayed. There is no `due_back_on` column and no working-day calendar.

A second application while one is still Pending is refused by leave logic. A configuration flag can turn that refusal off, and the flag defaults to refusal. The database does not add a partial unique index, because that flag must be able to allow a second pending application.

Omitted: Draft, Completed, reason, entitlement, supporting documents, reviewer comments, `submitted_at`, `decided_by`, and `decided_at`. `created_at` is the submission time. The audit log records who approved or rejected the application.

## Leave workflow

`LeaveService` is the API.

- `submit(actor, input)` is allowed only when `LeaveApplicationPolicy.create` allows it, so an officer can submit only for their own Personnel record. `input` is `personnelId`, `leaveType` (`casual` or `annual`), `startsOn`, and `endsOn`. The client cannot choose the status. The row is stored as `pending`. Name and designation are not written.
- `ends_on` must be on or after `starts_on`. Both values are calendar dates.
- `actor.userId` is the `users.id` stored on the audit row. It may be null.
- While `config.leave.refuseSecondPending` is true, which is the default, submit is refused when that officer already has a `pending` row. When the flag is false, a second pending row is allowed. The caller passes the flag into `LeaveService`. The check and the insert run in one database transaction.
- `approve(actor, applicationId)` and `reject(actor, applicationId)` are allowed only when `LeaveApplicationPolicy.decide` allows it. That is the Permanent Secretary. The Honorable Minister can view and cannot decide. Only a `pending` row can move to `approved` or `rejected`.
- `dueBackOn(endsOn)` is the calendar day after `ends_on`, using calendar-date arithmetic. It is not stored.
- Submit, approval, and rejection each write an audit row in the same transaction as the leave change. The row uses module `leave`, subject type `leave_application`, and before/after JSON. The after JSON includes the actor's role and links. It does not store a password, name, or designation.
- `notify.queue` runs only after a successful submit commits. Approval and rejection do not queue a notice. If the transaction fails, the leave row and the audit row roll back and the notice is not queued. `QueueLeaveSubmitted` is the notifier that dispatches `NotifyLeaveSubmitted`.

## Vacation notification schema

`vacation_notifications` belongs to one Personnel record. It is not a leave application and it has no approval status.

| Column | Rule |
|---|---|
| `personnel_id` | Required foreign key to `personnel.id`. Deleting a personnel row is restricted while a notification points at it |
| `travelling_country` | Required. Free text. There is no country catalog |
| `reason` | Required text |
| `submitted_on` | Required date. This is the submission date from VA-03 |

Only a Foreign Service Officer may file a notification. That check is account logic, because the table cannot see the user's role. The officer's name and designation are read from the Personnel record. They are not copied onto the notification.

The submitting officer and an Administrator may view the notice. Other viewers stay undecided.

Omitted: destination city, travel dates, return date, status, approval, contact while away, and documents.

## Vacation notification workflow

`VacationNotificationService` is the API.

- `file(actor, input)` is allowed only when `VacationNotificationPolicy.create` allows it for `actor.personnelId`. The input is `travellingCountry`, `reason`, and `submittedOn`. It does not include a personnel id. The stored `personnel_id` is the actor's own link.
- The country and the reason are trimmed. A blank value is refused. `submittedOn` must be a calendar date.
- Name and designation are not copied onto the notice. There is no status and no approval.
- `visibleTo(actor)` returns every notice for an Administrator and the officer's own notices for a Foreign Service Officer. Every other role receives an empty list. `canList(actor)` is that same audience, used before the index is rendered.

## Correspondence schema

`correspondence` is one shared letter. There is no second incoming copy. Sent means `from_mission_id` is the viewer's mission. Received means `to_mission_id` is the viewer's mission. "Received from" is `from_mission_id` on that received view. Both missions are Gambian `missions`, including Home. This table does not reference foreign diplomatic missions.

| Column | Rule |
|---|---|
| `from_mission_id` | Required foreign key to `missions.id`. A mission cannot be deleted while a letter names it as sender |
| `to_mission_id` | Required foreign key to `missions.id`. A mission cannot be deleted while a letter names it as recipient. Must differ from `from_mission_id` |
| `body` | Required text. The letter content |
| `composed_on` | Required date. The date of composition |
| `pdf_path` | Required. Private-disk path of the generated PDF. The database stores the path, not the file bytes |

A Foreign Service Officer composes for their current post. A Mission / Post User composes for their assigned mission. A Home user in those roles sees letters where Home is sender or recipient, and does not see letters between two other missions. Those rules are account logic. The table has no user column and no personnel column.

Omitted: subject, reference number, extra attachments, draft status, confidentiality, and a separate received-from column.

## Correspondence workflow

`CorrespondenceService` is the API. The caller passes the private disk.

- `compose(actor, input)` resolves the viewer's mission and uses it as the sender. The input does not choose `from_mission_id`. A Mission / Post User uses `actor.missionId`. A Foreign Service Officer uses the mission of their single open posting. Zero or many open postings deny composition. Administrator, Honorable Minister, and Permanent Secretary cannot compose.
- `input` is `toMissionId`, `body`, and `composedOn`. The body is required. The recipient must be a different existing Gambian mission. `composedOn` is a calendar date.
- The PDF is rendered, then stored on the private disk, then the correspondence row and the audit row are inserted in one database transaction. The row stores `pdf_path` only. The audit `after` JSON stores the path and the letter fields, not the PDF bytes.
- If that transaction fails, the stored PDF is deleted. A queue or filesystem failure is not involved after commit: the letter and the audit row are already committed, and the file remains.
- `visibleTo(actor)` returns letters whose sender or recipient is the viewer's mission. A viewer with no mission, including the Minister, receives an empty list.
- `CorrespondencePdf` writes a one-page PDF with the sending mission, receiving mission, date, and body. A richer PDF library is still undecided.

## Files

- Photographs and generated correspondence PDFs are stored on the private disk. The database stores the path.
- A photograph is optional on the personnel record and on the foreign diplomatic staff record. It is limited to JPEG or PNG, and limited to 2 MB.
- The PDF library for a richer layout is undecided. `CorrespondencePdf` and `ForeignDirectoryPdf` write one-page PDFs until that choice is made.

## Photograph upload

`PhotographService` is the API. The caller passes the private disk. The entry points are `replacePersonnel` and `replaceDiplomaticStaff`.

- `replacePersonnel(actor, personnelId, file)` is allowed only when `PersonnelPolicy.update` allows it. That is the Administrator. A Foreign Service Officer can view their own record and cannot replace the photograph.
- `replaceDiplomaticStaff(actor, staffId, file)` is allowed only when `ForeignDiplomaticStaffPolicy.update` allows it. That is the Administrator.
- The file is optional on the record. Calling replace is the only way this workflow changes `photograph_path`. Leaving the file out of some other edit does not clear the path. This workflow has no separate clear action.
- Accept the file only when its bytes are a JPEG (`FF D8 FF`) or a PNG (the eight-byte PNG signature), and only when the size is at most 2 mebibytes (2,097,152 bytes). The client content type and the client filename do not decide the type. Any other type, an empty file, or a larger file is refused before anything is written.
- The stored name is generated. The client filename is not used as the path. A personnel photograph is `photographs/personnel/{id}/{uuid}.jpg` or `.png`. A diplomatic staff photograph is `photographs/diplomatic-staff/{id}/{uuid}.jpg` or `.png`. The column stores that relative path, never the image bytes.
- Replacement order:

```text
authorize
   ↓
validate type and size
   ↓
write the new private file
   ↓
transaction
  ├── set photograph_path
  └── audit the previous path and the new path
   ↓
COMMIT
   ↓
delete the previous file, when there was one
```

- If the transaction fails, the new file is deleted and the previous path and previous file stay as they were. The audit row rolls back with the path change.
- The previous file is deleted only after commit. If that delete fails, the row still points at the new file. The database does not point at a file this workflow has already removed.
- The audit `before` and `after` values are the paths, or null when there was no photograph. They do not contain the image bytes or a password.
- A read of the bytes goes through the private disk after `PersonnelPolicy.view` or `ForeignDiplomaticStaffPolicy.view` allows it. The path is not a public URL. A caller who cannot view the record is refused before the disk is read.

## Foreign-directory export

`ForeignDirectoryExportService.exportDirectory(actor, filter)` is the API. It exports foreign diplomatic missions, their staff, and those staff dependents. It does not export Gambian personnel, Gambian missions, or postings.

- `exportDirectory(actor, filter)` is allowed only when `ForeignDiplomaticMissionPolicy.export` allows it. That is the Administrator. The service calls `export`, not `create` or `update`, so a later change to who may export does not change who may create or update records.
- Honorable Minister, Permanent Secretary, Foreign Service Officer, and Mission / Post User are refused.
- `filter` may narrow by country and mission name. Both are optional case-insensitive substrings. With no filter, the export contains the whole foreign directory. Staff and dependents are included only for missions that remain after the filter.
- The PDF lists the mission, staff, and dependent fields. It does not include `photograph_path` and it does not embed photograph bytes. A richer PDF library is still undecided, and the service accepts a replacement writer the way correspondence does.
- The export is generated for the response. It is not inserted into `correspondence` and it is not stored as a new registry row. A failed render writes nothing.
- Export does not write an audit row. It does not change the registry.

## Phase 2 schema

Locked from the specification plus the approved schema decisions. These two registries stay in separate tables. Current posting is not a column on `personnel`. It is the open Posting row, which is Phase 3. `PR-02` still requires that posting. Phase 2 does not satisfy that part.

`users.personnel_id` becomes a real foreign key to `personnel.id` in the Phase 2 migration. The column stays nullable. Deleting a personnel row is restricted while a user points at it. The column is not unique. Account management, not a check constraint, enforces which role must have the link.

### `personnel`

| Column | Rule | Source |
|---|---|---|
| `full_name` | Required | Specification: full name |
| `date_of_birth` | Required | Specification: date of birth |
| `passport_number` | Required, indexed, not unique | Specification, plus the passport assumption |
| `email` | Nullable | Approved contact details |
| `phone` | Nullable | Approved contact details |
| `address` | Nullable | Approved contact details |
| `designation` | Required free text | Specification. The examples are not a closed list |
| `photograph_path` | Nullable | Specification photograph, stored on the private disk |

Omitted: service number, national ID, gender, marital status, nationality, department, employment dates, next of kin, and `current_posting_id`.

### `personnel_dependents`

`personnel_id` is required. Deleting a personnel row deletes these rows.

| Column | Rule | Source |
|---|---|---|
| `full_name` | Required | Approved |
| `relationship` | Required free text | Approved. Not limited to spouse or child |
| `date_of_birth` | Nullable | Approved |

Omitted: passport, contact, and nationality.

### `foreign_diplomatic_missions`

| Column | Rule | Source |
|---|---|---|
| `name` | Required | FD-04 |
| `country` | Required | Approved, and FD-06 searches by country |
| `address` | Required | FD-04, physical address in The Gambia |
| `email` | Required | FD-04, official mission email |
| `phone` | Required | FD-04, official mission phone |

Omitted: city, website, head of mission, mission type, and accreditation status.

### `foreign_diplomatic_staff`

`foreign_diplomatic_mission_id` is required. A mission cannot be deleted while staff point at it. There is no user column.

| Column | Rule | Source |
|---|---|---|
| `full_name` | Required | Specification: name |
| `nationality` | Required | Specification |
| `passport_number` | Required, indexed, not unique | Specification |
| `photograph_path` | Nullable | Specification photograph, private disk |
| `designation` | Required free text | Specification. Diplomatic rank is not a closed list |
| `country_represented` | Required | FD-03 |
| `accreditation_starts_on` | Required date | Specification: start of accreditation |
| `accreditation_ends_on` | Nullable date | Specification: end date where applicable |
| `email` | Nullable | Approved contact details |
| `phone` | Nullable | Approved contact details |

Omitted: address on the staff record, and any link to `users` or `personnel`.

### `foreign_diplomatic_dependents`

Included because FD-02 is mandatory. `foreign_diplomatic_staff_id` is required. Deleting a staff row deletes these rows.

| Column | Rule | Source |
|---|---|---|
| `full_name` | Required | Technical minimum for capturing a dependent |
| `relationship` | Required, `spouse` or `child` only | Specification: spouse and children |

Omitted: date of birth, passport, contact, and nationality. Those were not approved for this dependent.

## Frontend contract

React and Inertia screens consume the existing HTTP routes and domain behavior. A screen does not introduce database fields, API endpoints, authorization rules, or a second copy of business rules in order to be easier to build. If a screen needs behavior the server does not already provide, that requirement is written down before the server changes.

Navigation hides links a role cannot use. The policy on the server remains the authorization check.

The personnel index returns the full register. The index screen filters that loaded list in the browser. That filter is not a new search endpoint.

`GET /personnel/{personnel}/postings` also includes the Gambian mission id and name list so the assignment form can offer a mission. The assignment itself is still `POST` with `mission_id` and `starts_on`, and `PostingService.assign` still performs it.

Photographs stay on the private disk. Personnel and foreign diplomatic staff Inertia props send `photograph_on_file` and do not send `photograph_path`. There is no public photograph address.

The dashboard lists the sections the signed-in role may open. It does not invent counts or an activity feed.

Account create and edit include the role, personnel, and Gambian mission lists so the form can show the relevant link. A Foreign Service Officer form shows personnel. A Mission / Post User form shows a mission. Administrator, Honorable Minister, and Permanent Secretary forms may show an optional personnel link and do not show a mission link. `AccountAssignmentRules` still accepts or refuses the posted assignment. The account index filters the loaded list in the browser.

Leave has no show route. The index is the list and, for the Permanent Secretary, the decision surface: pending rows post to the existing approve and reject routes. The Minister sees the same list without those actions. A Foreign Service Officer sees their own applications and may open create. Create posts `personnel_id` from the signed-in account, with `leave_type` of `casual` or `annual`. Due-back is included only when the application is approved. A second pending application still returns the existing 422 response.

A vacation notification is filed by a Foreign Service Officer. The form posts `travelling_country`, `reason`, and `submitted_on`. It does not post a personnel id. `VacationNotificationService.file` uses the personnel link on the account. The index shows the notices `visibleTo` already returns, with the officer's name added for display. An Administrator sees the list and the notice, and does not get a file action.

Correspondence compose posts `to_mission_id`, `composed_on`, and `body`. The form has no sender field. The recipient list on the create screen omits the viewer's own mission. `CorrespondenceService.compose` still resolves the sender and refuses a letter addressed to that same mission. The index adds mission names beside the existing mission ids. A PDF is opened with `GET /correspondence/{correspondence}/pdf`. The private path is not sent to the screen.

Gambian mission create and edit post `name`. They do not post `is_home`, so a new mission is not Home and an edit keeps the existing flag. The list can show that flag. There is no delete action.

Foreign missions have no separate show route. `GET /foreign-missions/{mission}/staff` is the mission hub: mission details and that mission's diplomatic staff. Staff create, edit, and show use the existing nested routes. The staff form does not include a personnel or user field. The staff page shows `photograph_on_file` and posts a photograph to the existing upload route. Dependents are spouse or child, added and removed on the staff page. Directory export is a browser request to `GET /foreign-missions/export` with optional `country` and `mission_name`.

Built screens: Dashboard, Profile, Personnel index, create, show, and edit, posting history, Accounts index, create, and edit, Leave index and create, Vacation index, create, and show, Correspondence index and create, Gambian mission index, create, and edit, and the foreign mission, staff, dependent, photograph, and export screens. Other registered Inertia names render `Unbuilt` until those screens are built.

Form validation on an Inertia visit returns to the same screen with the field error. A workflow refusal, including an invalid photograph and a second pending leave application, stays the existing `422` HTML page. `403`, `404`, and `500` pages are the framework HTML pages. A saved photograph redirects back with the status message `Photograph saved.` The upload form states the JPEG or PNG and 2 MB limit. The screen says `Photograph on file` or `No photograph`.

Navigation is convenience. The server still returns `403` when a role opens a section it cannot use.

| Role | Navigation | Server refusal examples |
| --- | --- | --- |
| Administrator | Accounts, Personnel, Missions, Vacation, Foreign missions | Leave, correspondence, leave decisions |
| Honorable Minister | Leave, without approve or reject | Personnel, missions, accounts, vacation, correspondence, foreign missions |
| Permanent Secretary | Leave, including approve and reject | Personnel, missions, accounts, vacation, correspondence, foreign missions |
| Foreign Service Officer | Own personnel record, Leave, Vacation, Correspondence | Personnel index, accounts, missions, foreign missions, another officer's vacation notice |
| Mission / Post User | Correspondence for the assigned mission | Personnel, leave, vacation, missions, foreign missions |
