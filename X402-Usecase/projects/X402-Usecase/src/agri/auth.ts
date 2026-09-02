export type UserRole = 'Farmer' | 'Consumer'

export interface AgriUser {
  name: string
  mobile: string
  state: string
  userType: UserRole
  password: string
  /** Mirrors userType so existing dashboards keep working. */
  role: UserRole
}

export const AGRI_STATES = [
  'Punjab',
  'Haryana',
  'Uttar Pradesh',
  'Rajasthan',
  'Madhya Pradesh',
  'Maharashtra',
  'Gujarat',
  'Bihar',
  'West Bengal',
  'Karnataka',
  'Telangana',
  'Andhra Pradesh',
  'Tamil Nadu',
  'Odisha',
  'Chhattisgarh',
  'Assam',
  'Himachal Pradesh',
  'Uttarakhand',
] as const

export type AgriState = (typeof AGRI_STATES)[number]

const USERS_KEY = 'KrishiConnect_users'
const SESSION_KEY = 'KrishiConnect_session'

export function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2)
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1)
  }
  return digits
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile)
}

function readUsers(): AgriUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.map(hydrateUser).filter((u): u is AgriUser => Boolean(u))
  } catch {
    return []
  }
}

function hydrateUser(raw: unknown): AgriUser | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as Record<string, unknown>
  const name = String(rec.name ?? '').trim()
  const mobile = normalizeMobile(String(rec.mobile ?? ''))
  const state = String(rec.state ?? '').trim()
  const userType = (rec.userType ?? rec.role) as UserRole
  const password = String(rec.password ?? '')
  if (!name || !isValidMobile(mobile) || !password || (userType !== 'Farmer' && userType !== 'Consumer')) {
    return null
  }
  return {
    name,
    mobile,
    state: state || 'Punjab',
    userType,
    password,
    role: userType,
  }
}

function writeUsers(users: AgriUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function findByMobile(mobile: string): AgriUser | undefined {
  const normalized = normalizeMobile(mobile)
  return readUsers().find((u) => u.mobile === normalized)
}

export function getSession(): AgriUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? hydrateUser(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function login(mobile: string, password: string): AgriUser {
  const match = findByMobile(mobile)
  if (!match || match.password !== password) {
    throw new Error('Mobile number or password is incorrect. Register if you are a new user.')
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(match))
  return match
}

export function generateMockOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function sendLoginOtp(mobile: string): string {
  const normalized = normalizeMobile(mobile)
  if (!isValidMobile(normalized)) {
    throw new Error('Enter a valid 10-digit mobile number.')
  }
  if (!findByMobile(normalized)) {
    throw new Error('This mobile number is not registered. Please register first.')
  }
  return generateMockOtp()
}

export function loginWithOtp(mobile: string, otp: string, expectedOtp: string): AgriUser {
  if (!expectedOtp || otp.trim() !== expectedOtp) {
    throw new Error('Invalid OTP. Request a new code and try again.')
  }
  const match = findByMobile(mobile)
  if (!match) {
    throw new Error('This mobile number is not registered. Please register first.')
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(match))
  return match
}

export function register(
  name: string,
  mobile: string,
  state: string,
  userType: UserRole,
  password: string,
): AgriUser {
  const trimmed = name.trim()
  const normalizedMobile = normalizeMobile(mobile)
  const region = state.trim()
  if (!trimmed || !password) {
    throw new Error('Full name and password are required.')
  }
  if (!isValidMobile(normalizedMobile)) {
    throw new Error('Enter a valid 10-digit Indian mobile number.')
  }
  if (!region) {
    throw new Error('Please select your state / region.')
  }
  const users = readUsers()
  if (users.some((u) => u.mobile === normalizedMobile)) {
    throw new Error('That mobile number is already registered. Please log in.')
  }
  const user: AgriUser = {
    name: trimmed,
    mobile: normalizedMobile,
    state: region,
    userType,
    password,
    role: userType,
  }
  users.push(user)
  writeUsers(users)
  return user
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}
