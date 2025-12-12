# Ministry Frontend Implementation Plan

## User Review Required
None

## Proposed Changes

### Routes
#### [MODIFY] [App.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/App.tsx)
- Add `/ministries` route.

### Components
#### [MODIFY] [app-sidebar.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/components/app-sidebar.tsx)
- Add "사역부서" to `adminMenuItems`.

### Pages
#### [NEW] [ministries.tsx](file:///c:/AI%20PROJECT/gw_gyojuk/client/src/pages/ministries.tsx)
- Implementation of the ministry management page.
- List existing ministries.
- Create/Edit/Delete ministry functionality.
- Assign Teachers/Students (Dialog/Modal).

## Verification Plan
### Manual Verification
- Verify navigation link appears in sidebar.
- Verify page loads correctly.
- Test CRUD operations for ministries.
- Test assigning teachers and students to a ministry.
