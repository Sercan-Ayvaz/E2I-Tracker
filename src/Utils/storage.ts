/**
 * storage.ts - LocalStorage CRUD Wrapper
 * Handles data persistence, authentication, and transaction logic.
 */

const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 'e2iTrackerData';
const SESSION_KEY = 'e2iTrackerSession';
const SCHEMA_VERSION = import.meta.env.VITE_SCHEMA_VERSION || 'v1';

const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  families: {},
  users: {},
  transactions: {},
  recurringTransactions: {},
};

/**
 * Retrieves the current state from LocalStorage.
 * Resets to DEFAULT_STATE if schema version mismatches or data is corrupted.
 */
function getState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_STATE;
    const parsed = JSON.parse(data);
    if (parsed.schemaVersion !== SCHEMA_VERSION) return DEFAULT_STATE;
    return parsed;
  } catch (error) {
    console.error('Storage parse error:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Updates the LocalStorage state using an updater function.
 */
function setState(updater) {
  const current = getState();
  const newState = updater(current);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
}

/**
 * Initializing storage if empty.
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
  }
}

/**
 * Generates a unique Family ID in E2I-XXX-XXX-XXX format.
 */
function generateFamilyId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'E2I-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hashes a string using SHA-512 with a unique salt for security.
 */
async function hashPassword(password) {
  const salt = "E2I_Tracker_Secure_2024_Salt";
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

/**
 * Creates a new user record. Throws error if username or email is taken.
 */
async function createUser(user) {
  const state = getState(); // getState is synchronous
  const normalizedUsername = user.username?.trim();
  const normalizedEmail = user.email?.trim();

  if (!normalizedUsername || !normalizedEmail) {
    throw new Error('Username and email are required.');
  }

  const usernameTaken = Object.values(state.users).some((u: any) => 
    (u.username || '').toLowerCase().trim() === normalizedUsername.toLowerCase()
  );
  if (usernameTaken) {
    throw new Error('Username is already taken.');
  }

  const emailTaken = Object.values(state.users).some((u: any) => 
    (u.email || '').toLowerCase().trim() === normalizedEmail.toLowerCase()
  );
  if (emailTaken) {
    throw new Error('Email is already registered.');
  }

  const id = generateUUID();
  const passwordHash = await hashPassword(user.password.trim());
  const { password, ...userData } = user;
  
  const newUser = {
    ...userData,
    username: normalizedUsername,
    email: normalizedEmail,
    id,
    passwordHash,
    familyId: '',
    role: user.role || 'Member',
  };
  
  setState(state => ({
    ...state,
    users: { ...state.users, [id]: newUser },
  }));
  
  return newUser;
}

function getUser(id) {
  const state = getState();
  return state.users[id] || null;
}

/**
 * Updates user details and synchronizes session storage.
 */
function updateUser(id, updates) {
  setState(state => {
    const updatedUser = { ...state.users[id], ...updates };
    const newState = {
      ...state,
      users: { ...state.users, [id]: updatedUser },
    };
    
    const current = getCurrentUser();
    if (current?.id === id) {
      setCurrentUser(updatedUser);
    }
    return newState;
  });
}

/**
 * Deletes a user record.
 */
function deleteUser(id) {
  setState(state => {
    const { [id]: deleted, ...users } = state.users;
    return { ...state, users };
  });
}

/**
 * Generates a unique UUID with fallback for non-secure contexts.
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Authenticates a user. 
 * Supports login via Username, Email, or UUID.
 * Handles password hash comparison and legacy data migration.
 * Returns user object if successful, null otherwise.
 */
async function loginUser(username, password) {
  const state = getState();
  if (!username || !password) return null;

  const searchInput = username.trim().toLowerCase();

  const user = Object.values(state.users).find((u: any) => {
    const storedUsername = (u.username || '').toLowerCase().trim();
    const storedEmail = (u.email || '').toLowerCase().trim();
    const matchUsername = storedUsername === searchInput;
    const matchEmail = storedEmail === searchInput;
    const matchId = u.id === username.trim();
    return matchUsername || matchEmail || matchId;
  });

  if (!user) return null;

  const loginHash = await hashPassword(password.trim());
  if (user.passwordHash === loginHash) {
    setCurrentUser(user);
    return user;
  }

  if (user.password && user.password === password.trim()) {
    const newHash = await hashPassword(password.trim());
    setState((currentState) => ({
      ...currentState,
      users: {
        ...currentState.users,
        [user.id]: {
          ...user,
          passwordHash: newHash,
          password: undefined, // Remove plain text password
        },
      },
    }));
    setCurrentUser({ ...user, passwordHash: newHash });
    return { ...user, passwordHash: newHash };
  }

  return null;
}

function createTransaction(transaction) {
  const id = generateUUID();
  const newTransaction = { ...transaction, id };
  setState(state => ({
    ...state,
    transactions: { ...state.transactions, [id]: newTransaction },
  }));
  return newTransaction;
}

function getTransaction(id) {
  const state = getState();
  return state.transactions[id] || null;
}

function getTransactionsByFamily(familyId) {
  const state = getState();
  return Object.values(state.transactions).filter(t => t.familyId === familyId);
}

function getTransactionsByUser(userId) {
  const state = getState();
  return Object.values(state.transactions).filter(t => t.userId === userId && !t.familyId);
}

/**
 * Updates an existing transaction and adds an audit trail record.
 */
function updateTransaction(id, updates) {
  const user = getCurrentUser();
  setState(state => ({
    ...state,
    transactions: { 
      ...state.transactions, 
      [id]: { 
        ...state.transactions[id], 
        ...updates,
        userId: state.transactions[id].userId,
        familyId: state.transactions[id].familyId,
        updatedAt: new Date().toISOString(),
        history: [
          ...(state.transactions[id].history || []),
          {
            updatedAt: new Date().toISOString(),
            updatedBy: user?.displayName || 'System',
            changes: determineChanges(state.transactions[id], updates)
          }
        ]
      } 
    },
  }));
}

function determineChanges(oldVal, newVal) {
  const changes = [];
  if (newVal.amount && oldVal.amount !== newVal.amount) changes.push(`Amount: ${oldVal.amount} -> ${newVal.amount}`);
  if (newVal.title && oldVal.title !== newVal.title) changes.push(`Description updated`);
  return changes.join(', ') || 'Güncelleme yapıldı';
}

function deleteTransaction(id) {
  setState(state => {
    const { [id]: deleted, ...transactions } = state.transactions;
    return { ...state, transactions };
  });
}

function createRecurringTransaction(recData) {
  const id = generateUUID();
  const newRecurring = { 
    ...recData, 
    id, 
    lastProcessedMonth: recData.lastProcessedMonth || '' 
  };
  setState(state => ({
    ...state,
    recurringTransactions: { ...state.recurringTransactions, [id]: newRecurring },
  }));
  return newRecurring;
}

function updateRecurringTransaction(id, updates) {
  setState(state => ({
    ...state,
    recurringTransactions: {
      ...state.recurringTransactions,
      [id]: { ...state.recurringTransactions[id], ...updates }
    }
  }));
}

function getRecurringTransactions(familyId) {
  const state = getState();
  return Object.values(state.recurringTransactions || {}).filter((t: any) => t.familyId === familyId);
}

function getRecurringTransactionsByUser(userId) {
  const state = getState();
  return Object.values(state.recurringTransactions || {}).filter((t: any) => t.userId === userId && !t.familyId);
}

function deleteRecurringTransaction(id) {
  setState(state => {
    const { [id]: deleted, ...recurringTransactions } = state.recurringTransactions;
    return { ...state, recurringTransactions };
  });
}

/**
 * Automation engine: Checks for pending recurring transactions and adds them to history.
 */
function processRecurringTransactions() {
  const user = getCurrentUser();
  if (!user) return;

  const state = getState();
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDay = now.getDate();

  let hasNewTransactions = false;
  const updatedRecurring = { ...state.recurringTransactions };

  Object.values(state.recurringTransactions || {}).forEach((rec: any) => {
    if (rec.userId === user.id && rec.lastProcessedMonth !== currentMonthStr && (currentDay >= rec.dayOfMonth || now.getMonth() > new Date(rec.lastProcessedMonth).getMonth())) {
      const transactionId = generateUUID();
      const newTx = {
        id: transactionId,
        userId: rec.userId,
        familyId: rec.familyId,
        title: `[Otomatik] ${rec.title}`,
        amount: rec.amount,
        category: rec.category,
        date: now.toISOString(),
        isPrivate: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        investmentType: rec.investmentType,
        price: rec.price,
        history: [{
          updatedAt: now.toISOString(),
          updatedBy: 'System',
          changes: 'Auto recurring transaction processed'
        }]
      };

      state.transactions[transactionId] = newTx;
      updatedRecurring[rec.id].lastProcessedMonth = currentMonthStr;
      hasNewTransactions = true;
    }
  });

  if (hasNewTransactions) {
    setState(s => ({ ...s, transactions: state.transactions, recurringTransactions: updatedRecurring }));
  }
}

/**
 * Migrates personal transactions of a user to a family.
 */
function migrateTransactionsToFamily(userId, familyId) {
  setState(state => {
    const transactions = { ...state.transactions };
    const recurringTransactions = { ...state.recurringTransactions };

    Object.values(transactions).forEach((t: any) => {
      if (t.userId === userId && !t.familyId) {
        transactions[t.id] = { ...t, familyId };
      }
    });

    Object.values(recurringTransactions).forEach((r: any) => {
      if (r.userId === userId && !r.familyId) {
        recurringTransactions[r.id] = { ...r, familyId };
      }
    });

    return { ...state, transactions, recurringTransactions };
  });
}

function createFamily(family) {
  const id = generateFamilyId();
  const newFamily = { 
    ...family, 
    id,
    founderId: family.masterId,
    pendingMembers: [],
    createdAt: family.createdAt || new Date().toISOString()
  };
  setState(state => ({
    ...state,
    families: { ...state.families, [id]: newFamily },
  }));
  return newFamily;
}

function getFamily(id) {
  const state = getState();
  return state.families[id] || null;
}

function updateFamily(id, updates) {
  setState(state => ({
    ...state,
    families: { ...state.families, [id]: { ...state.families[id], ...updates } },
  }));
}

function deleteFamily(id) {
  setState(state => {
    const { [id]: deleted, ...families } = state.families;
    const transactions = { ...state.transactions };
    const recurringTransactions = { ...state.recurringTransactions };

    // Aile silindiğinde işlemleri tekrar kişisel hale getir (verinin kaybolmaması için)
    Object.values(transactions).forEach((t: any) => {
      if (t.familyId === id) transactions[t.id] = { ...t, familyId: '' };
    });

    Object.values(recurringTransactions).forEach((r: any) => {
      if (r.familyId === id) recurringTransactions[r.id] = { ...r, familyId: '' };
    });

    return { ...state, families, transactions, recurringTransactions };
  });
}

// Aileye katılma başvurusu
function requestJoinFamily(familyId, userId) {
  setState(state => {
    const family = state.families[familyId];
    if (!family) throw new Error('Aile bulunamadı');
    if (family.members.includes(userId)) throw new Error('Zaten aile üyesisiniz');
    if (family.pendingMembers.includes(userId)) throw new Error('Başvurunuz zaten bekliyor');

    return {
      ...state,
      families: {
        ...state.families,
        [familyId]: {
          ...family,
          pendingMembers: [...family.pendingMembers, userId]
        }
      }
    };
  });
}

// Aileye katılma başvurusunu onaylama/reddetme
function approveJoinRequest(familyId, userId, approve = true) {
  setState(state => {
    const family = state.families[familyId];
    if (!family) throw new Error('Aile bulunamadı');

    const pendingMembers = family.pendingMembers.filter(id => id !== userId);
    let members = [...family.members];
    let users = { ...state.users };

    if (approve) {
      members.push(userId);
      const user = users[userId];
      if (user) {
        users[userId] = { ...user, role: 'Member', familyId };
        
        // Üye onaylandığında kişisel geçmişini aileye aktar
        Object.values(state.transactions).forEach((t: any) => {
          if (t.userId === userId && !t.familyId) {
            state.transactions[t.id] = { ...t, familyId };
          }
        });
        Object.values(state.recurringTransactions).forEach((r: any) => {
          if (r.userId === userId && !r.familyId) {
            state.recurringTransactions[r.id] = { ...r, familyId };
          }
        });
      }
    }

    return {
      ...state,
      families: {
        ...state.families,
        [familyId]: {
          ...family,
          members,
          pendingMembers
        }
      },
      users
    };
  });
}

/**
 * Removes a user from a family and resets their role.
 */
function leaveFamily(userId) {
  setState(state => {
    const user = state.users[userId];
    if (!user || !user.familyId) throw new Error('Membership not found');

    const family = state.families[user.familyId];
    if (!family) throw new Error('Family not found');

    const members = family.members.filter(id => id !== userId);
    const pendingMembers = family.pendingMembers.filter(id => id !== userId);

    const updatedUser = {
      ...user,
      familyId: '',
      role: 'Member'
    };

    const currentSession = sessionStorage.getItem(SESSION_KEY);
    if (currentSession && JSON.parse(currentSession).id === userId) {
      setCurrentUser(updatedUser);
    }

    return {
      ...state,
      families: {
        ...state.families,
        [user.familyId]: {
          ...family,
          members,
          pendingMembers
        }
      },
      users: {
        ...state.users,
        [userId]: updatedUser
      }
    };
  });
}

function setCurrentUser(user) {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function getCurrentUser() {
  const sessionData = sessionStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;
  try {
    const sessionUser = JSON.parse(sessionData);
    const state = getState();
    return state.users[sessionUser.id] || sessionUser;
  } catch {
    return null;
  }
}

export { 
  initStorage,
  generateFamilyId,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
  createTransaction,
  getTransaction,
  getTransactionsByFamily,
  getTransactionsByUser,
  updateTransaction,
  migrateTransactionsToFamily,
  deleteTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionsByUser,
  deleteRecurringTransaction,
  processRecurringTransactions,
  createFamily,
  getFamily,
  updateFamily,
  deleteFamily,
  requestJoinFamily,
  approveJoinRequest,
  leaveFamily,
  setCurrentUser,
  getCurrentUser,
};