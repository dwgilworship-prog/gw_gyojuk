# Ministry Frontend Implementation Plan

## User Review Required
None

## Proposed Changes

### Routes & Backend
#### [MODIFY] [server/routes.ts](file:///c:/AI%20PROJECT/gw_gyojuk/server/routes.ts)
- Add `GET /api/ministry-members` to fetch all student and teacher assignments to ministries (for efficient frontend mapping).

#### [MODIFY] [App.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/App.tsx)
- Add `/ministries` route.

### Components
#### [MODIFY] [app-sidebar.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/components/app-sidebar.tsx)
- Add "사역부서" to `adminMenuItems`.

### Pages
#### [NEW] [ministries.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/pages/ministries.tsx)
- Ministry management (CRUD).
- Dialogs for adding/editing ministries.

#### [MODIFY] [students.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/pages/students.tsx)
- **Data**: Fetch ministries and ministry-members.
- **List**: Add "사역" (Ministry) column. Display assigned ministries.
- **Form (Create/Edit)**: Add Ministry selector (Checkboxes/Multi-select).
- **Submit**: Handle saving ministry assignments (synced with student save).

#### [MODIFY] [teachers.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/pages/teachers.tsx)
- **Data**: Fetch ministries and ministry-members.
- **List**: Add "사역" (Ministry) column. Display assigned ministries.
- **Form (Create/Edit)**: Add Ministry selector.
- **Submit**: Handle saving ministry assignments.

## Verification Plan
### Manual Verification
- **Ministry Page**: Create/Edit/Delete ministries.
- **Student Page**:
    - Verify "Ministry" column shows assignments.
    - Create Student with Ministries -> Verify saved.
    - Edit Student -> Change Ministries -> Verify updated.
- **Teacher Page**:
    - Verify "Ministry" column.
    - Create/Edit Teacher with Ministries -> Verify saved.
