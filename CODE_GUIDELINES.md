# Code Syntax & Architecture Guidelines

## 1. Naming Conventions
- **Components:** PascalCase (örn: `TransactionTable.jsx`)
- **Functions/Variables:** camelCase (örn: `calculateTotalBalance`)
- **Interfaces:** PascalCase, Prefix 'I' or just Name (örn: `ITransaction`)

## 2. Tailwind CSS Rules
- **Modern UI:** Use `rounded-xl`, `shadow-sm`, and `gap-4` for layouts.
- **Colors:** - Income: `text-emerald-500`
  - Expense: `text-rose-500`
  - Neutral: `text-slate-400`
- **Responsive:** Always use `md:` and `lg:` breakpoints for dashboard columns.

## 3. State & Logic
- **LocalStorage:** Always use the `Utils/storage.js` wrapper. Do not call `localStorage` directly in components.
- **Role Control:** Wrap sensitive UI elements with:
  `{user.role === 'Master' && <AdminButton />}`

## 4. Error Handling
- Every form input must have validation.
- Failed actions must show a red border or a toast notification.