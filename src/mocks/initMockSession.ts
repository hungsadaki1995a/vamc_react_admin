// Pre-seeds vamc-auth localStorage before MSW starts.
// App.tsx restoreSession() checks authStore.user.usrId — if missing, immediately calls logout().
// Zustand persist format: { state: { user, roles }, version: 0 }
const PMS_AUTH_KEY = 'vamc-auth';

export function initMockSession(): void {
  if (localStorage.getItem(PMS_AUTH_KEY)) return; // already set from previous session
  localStorage.setItem(
    PMS_AUTH_KEY,
    JSON.stringify({
      state: {
        user: { usrId: 'admin', usrNm: '관리자', email: 'admin@example.com' },
        roles: ['ROLE_ADMIN'],
      },
      version: 0,
    }),
  );
}
