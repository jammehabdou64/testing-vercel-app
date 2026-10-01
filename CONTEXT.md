# Diplomatic Personnel Management

The system keeps the Gambian foreign service and the foreign missions accredited in The Gambia as separate registries.

## People

**Personnel**:
A Gambian foreign-service officer file.
_Avoid_: Staff, employee, foreign diplomatic staff, user

**Foreign Service Officer**:
A login that belongs to exactly one Personnel record.
_Avoid_: Mission user, diplomat

**Mission / Post User**:
A login for staff who handle correspondence for exactly one Gambian Mission. This login has no Personnel record.
_Avoid_: Foreign Service Officer, foreign diplomatic staff

**Foreign Diplomatic Staff**:
A person accredited to exactly one Foreign Diplomatic Mission in The Gambia. They are not Personnel and they have no login.
_Avoid_: Personnel, Foreign Service Officer, user

**Administrator**:
A login that manages personnel records, both mission registries, user accounts, and reference data. A Personnel link is optional.
_Avoid_: Superuser

**Honorable Minister**:
A login for the Honorable Minister. A Personnel link is optional.
_Avoid_: Permanent Secretary

**Permanent Secretary**:
A login for the Permanent Secretary. A Personnel link is optional.
_Avoid_: Honorable Minister, a single role shared with the Minister

## Places

**Mission**:
A Gambian posting location: Home, or a Gambian embassy or mission abroad.
_Avoid_: Foreign diplomatic mission, post as a person

**Home**:
The Gambian headquarters in Banjul. Home is a Mission.
_Avoid_: Foreign diplomatic mission, a separate headquarters table

**Foreign Diplomatic Mission**:
An embassy or high commission of another country based in The Gambia.
_Avoid_: Mission, Gambian post

**Posting**:
One Personnel record's assignment to one Mission for a period of time. The current posting is the assignment that has not ended. Past assignments stay on record.
_Avoid_: Current posting as a column copied onto the officer

## Other records

**Leave Application**:
A request for Casual Leave or Annual Leave. It is pending until the Permanent Secretary approves or rejects it.
_Avoid_: Vacation notification, out of office

**Vacation Notification**:
A notice that a staff member will be away, naming the country and the reason. It is not leave and it is not approved.
_Avoid_: Leave application

**Correspondence**:
An official letter between Home and a Mission, or between Missions, produced as a PDF.
_Avoid_: Email, chat, leave letter

**Personnel Dependent**:
A named person attached to a Personnel record, with a stated relationship to that officer.
_Avoid_: Foreign diplomatic dependent, next of kin

**Foreign Diplomatic Dependent**:
The spouse or child of a Foreign Diplomatic Staff member.
_Avoid_: Personnel dependent
