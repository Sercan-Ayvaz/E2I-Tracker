<<<<<<< HEAD
# E2I Tracker: Family Finance Management System

![E2I Tracker Screenshot]()
![E2I Tracker Screenshot]()

E2I Tracker is a role-based finance tracking application that allows families to easily manage their income, expense, and investment records. Users can create their own families, invite other members, record financial movements, and automate financial processes with recurring transactions. The application aims to increase intra-family transparency and financial health while offering privacy options for personal investment data.

## ✨ Features

-   **Secure Authentication:** Secure login and registration with username and SHA-512 hashed passwords. Your passwords are never stored in plain text.
-   **Comprehensive Family Management:**
    -   **Create Family:** Set up a new family and become the founder.
    -   **Join Family:** Apply to join existing families with an invitation code. Applications are approved by the founder.
    -   **Role-Based Authorization:**
        -   **Founder:** Has full authority such as deleting the family, approving/rejecting member applications, managing member roles (Master/Member), and removing members from the family.
        -   **Master:** Can view all family financial data and manage their own transactions but cannot delete others' transactions or change the family structure.
        -   **Member:** Can only view and manage their own financial transactions.
-   **Financial Transaction Management:**
    -   **Income, Expense, Investment Records:** Easily add, edit, and delete detailed financial movements.
    -   **Transaction History (Audit Trail):** Detailed records are kept showing who updated each transaction and when.
-   **Recurring Transactions:** Save time and simplify financial tracking by automatically adding monthly recurring income or expenses to the system.
-   **Personal Investment Privacy:** Users can hide their own investment records from other members of the family (including the founder).
-   **Multi-Language Support:** Available in Turkish, English, Spanish, French, German, Chinese, Arabic, Portuguese, Russian, and Japanese.
-   **Detailed Financial Summaries:** Track your family budget with instant financial status summaries such as total income, expense, investment, and balance.
-   **Advanced Filtering:** Detailed analysis by filtering transactions by month, year, category, and user.

## 🚀 How to Use?

Getting started with E2I Tracker is quite easy. Here is a step-by-step guide:

### 1. Registration and Login

-   Go to the **"Sign Up"** tab on the login/registration screen when you open the application.
-   Complete your registration by entering your name, surname, age, gender, email address, username, and a strong password. Your password must contain at least 8 characters, including uppercase letters, lowercase letters, numbers, and special characters.
-   After registering, you can log in to the system with your username and password from the **"Login"** tab.

### 2. Creating or Joining a Family

-   **Create a New Family:** If you are not a member of a family, the **"Family Management"** modal will open automatically after logging in. From here, select the **"Create"** tab, give your family a name, and set up your new family. You will automatically have the **"Founder"** role when you set up your family.
-   **Join an Existing Family:** If you want to join a family, select the **"Join"** tab in the **"Family Management"** window and apply by entering the family code given to you. You will become a member of the family when your application is approved by the family founder.

### 3. Managing Financial Transactions

-   You can create new transactions using the **"Add Income"**, **"Add Expense"**, or **"Add Investment"** buttons on the Dashboard page.
-   Complete the record by entering the transaction type, description, amount, and date in the form that opens. You can also enter additional information such as asset type, quantity, and unit price for investment transactions.
-   You can view, edit, or delete your existing transactions in the **"Transaction History"** table.

### 4. Setting Up Recurring Transactions

-   By checking the **"Repeat every month"** option in the **"Add Transaction"** form, you can ensure that a transaction you specify is automatically added to the system every month.
-   You can view, edit, or cancel your current recurring transactions from the **"Active Auto Plans"** section on the Dashboard.

### 5. Managing Family Members (For Founders)

-   You can see your family members and pending applications by going to the **"Manage"** tab in the **"Family Management"** modal.
-   You can approve or reject pending applications.
-   You can change members' roles (Master/Member) or remove members from the family.
-   You can invite new members by copying your family's invitation code.
-   **Danger Zone:** Founders have the option to permanently delete all family data. This action cannot be undone, so use it carefully.

### 6. Personal Investment Privacy

-   You can prevent your own investment records from being viewed by other members of the family by checking the **"Private Investments"** option in the profile section on the left panel of the Dashboard.

### 7. Changing Language

You can change the application language using the language selector in the top right corner of the Dashboard.

## 🛠️ Tech Stack

-   **Frontend:** [React.js](https://react.dev/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **State Management & Persistence:** LocalStorage (with a custom wrapper)
-   **Language Management:** Custom Translation Utility

## ⚙️ Installation and Development

Follow the steps below to run the project in your local environment:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Sercan-Ayvaz/GGY_Proje.git
    cd GGY_Proje
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # veya
    yarn install
    ```
3.  **Start the Development Server:**
    ```bash
    npm run dev
    # veya
    yarn dev
    ```
    

## 🤝 Contributing

Contributions are welcome! Any bug reports, feature requests, or code contributions are valuable. Please ensure you adhere to existing coding standards before submitting a pull request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more information.

## 📧 Contact

sercanayvzz@gmail.com

---

=======
# E2I-Tracker
E2I Tracker is a role-based financial tracking app that helps families easily manage their income, expenses, and investment records.
>>>>>>> 38029a9f28fb9aa9ebcebd6bb220e206cc2a772c
# E2I-Tracker
