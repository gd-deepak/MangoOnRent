const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || ''

async function submitToSheets(payload) {
  if (!SCRIPT_URL) { console.warn('[sheets] VITE_GOOGLE_SCRIPT_URL not set'); return { ok: true } }
  try {
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return { ok: true }
  } catch (e) { return { ok: false, reason: e.message } }
}

// Readable POST — text/plain avoids CORS preflight
async function callScript(payload) {
  if (!SCRIPT_URL) { console.warn('[sheets] not set:', payload.action); return { ok: false, error: 'Script URL not configured' } }
  try {
    const res = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
    return await res.json()
  } catch (e) { return { ok: false, error: e.message } }
}

// GET — no preflight
async function getFromScript(params) {
  if (!SCRIPT_URL) return { ok: false, error: 'Script URL not configured' }
  try {
    const res = await fetch(`${SCRIPT_URL}?${new URLSearchParams(params)}`)
    return await res.json()
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Form submissions ───────────────────────────────────────────────────────────
export async function submitContactForm(data) {
  return submitToSheets({ sheet: 'Contacts', timestamp: new Date().toISOString(), ...data })
}

// Booking with email + Drive screenshot upload
export async function submitBooking(data) {
  return callScript({ action: 'submitBooking', timestamp: new Date().toISOString(), ...data })
}

// ── User auth ─────────────────────────────────────────────────────────────────
export async function registerUser({ name, email, phone, city, passwordHash, passwordPlain }) {
  return callScript({ action: 'registerUser', name, email, phone, city, passwordHash, passwordPlain })
}
export async function loginUser({ email, passwordHash }) {
  return callScript({ action: 'loginUser', email, passwordHash })
}
export async function updateProfile({ email, name, phone, city, address }) {
  return callScript({ action: 'updateProfile', email, name, phone, city, address })
}
export async function changeUserPassword({ email, currentHash, newPasswordHash, newPasswordPlain }) {
  return callScript({ action: 'changeUserPassword', email, currentHash, newPasswordHash, newPasswordPlain })
}
export async function forgotPassword({ email }) {
  return callScript({ action: 'forgotPassword', email })
}

// ── Admin auth ────────────────────────────────────────────────────────────────
export async function adminLoginApi({ username, password }) {
  return callScript({ action: 'adminLogin', username, password })
}

// ── Admin management ──────────────────────────────────────────────────────────
export async function addAdmin({ username, name, email, password, addedBy }) {
  return callScript({ action: 'addAdmin', username, name, email, password, addedBy })
}
export async function getAdmins() {
  return getFromScript({ action: 'getAdmins' })
}
export async function confirmPayment({ bookingId }) {
  return callScript({ action: 'confirmPayment', bookingId })
}
export async function cancelPayment({ bookingId }) {
  return callScript({ action: 'cancelPayment', bookingId })
}
export async function adminChangePassword({ identifier, newPassword, newPasswordHash, userType }) {
  return callScript({ action: 'adminChangePassword', identifier, newPassword, newPasswordHash, userType })
}

// ── Admin record updates ──────────────────────────────────────────────────────
export async function updateBooking(data) {
  return callScript({ action: 'updateBooking', ...data })
}
export async function updateUser(data) {
  return callScript({ action: 'updateUser', ...data })
}
export async function updateAdmin(data) {
  return callScript({ action: 'updateAdmin', ...data })
}

// ── Data reads ────────────────────────────────────────────────────────────────
export async function getBookingsByEmail(email) {
  return getFromScript({ action: 'getBookingsByEmail', email })
}
export async function getAllBookings() {
  return getFromScript({ action: 'getAllBookings' })
}
export async function getAllUsers() {
  return getFromScript({ action: 'getAllUsers' })
}
export async function getAllUsersAdmin() {
  return getFromScript({ action: 'getAllUsersAdmin' })
}
export async function getAllPayments() {
  return getFromScript({ action: 'getAllPayments' })
}
