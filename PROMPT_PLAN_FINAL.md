# 🚀 Final Blueprint: E2I Tracker Dashboard

## 1. System Vision
A secure, family-based finance tracker where:
- **Master:** Full visibility of family expenses and members.
- **Member:** Privacy-protected view (can see personal details, but only "Totals" for other members).
- **Security:** Access is controlled via a unique FamilyID.

## 2. Folder Hierarchy
```text
src/
├── Components/
│   ├── Summary/     # 3-Column Cards
│   ├── Table/       # CRUD List
│   ├── Form/        # Add/Edit Modals
│   └── Auth/        # Role & Family Entry
├── Pages/
│   ├── Dashboard/
│   └── Profile/
├── Interfaces/      # Types & Interfaces
├── Utils/           # Storage & Privacy Logic
└── App.jsx
```

## 3. Family ID & Security Logic
- Generation: Alphanumeric 6-character unique code (e.g., OIKOS-9X21).

- Access: Users must provide the FamilyID to sync and view shared data.

- Privacy Rule: if (item.userId !== currentUser.id && item.isPrivate) { maskTitle(); }
(Non-owner members see "Private Transaction" instead of the real title).

## 4. Development Strategy (Phase-by-Phase)
- Setup: Vite + Tailwind + Folder structure creation.

- Auth Layer: Simple role (Master/Member) and FamilyID entry screen.

- Core CRUD: Implementation of Create, Read, Update, Delete using LocalStorage.

- UI/UX: 3-Column Dashboard design (Income, Expense, Investment) with Data Analyst polish.