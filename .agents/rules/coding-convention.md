---
trigger: always_on
---

# Coding Conventions

Follow these coding conventions across the project:

## 1. Custom Hooks with TanStack Query for API Calls

- **Always wrap API calls in custom hooks** using `@tanstack/react-query` (`useQuery`, `useMutation`, etc.) instead of calling API/SDK functions directly inside components or pages.
- **Follow `naming-convention.md`** for hook files and names:
  - Filename: `use-kebab-case.ts` (e.g., `use-customers.ts`, `use-send-verification-email.ts`)
  - Function name: `useCamelCase()` (e.g., `useCustomers()`, `useSendVerificationEmail()`)
- **Keep components declarative:** components should consume data, loading/error states, and mutation triggers from these custom hooks rather than managing raw request lifecycles (`useEffect` + `fetch`/SDK calls + manual `isLoading` state).
