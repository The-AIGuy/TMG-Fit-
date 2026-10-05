/**
 * Hardened Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies that all 12 attack vectors defined in security_spec.md are blocked.
 */
export interface SecurityPayloadTest {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityPayloadTest[] = [
  {
    id: 1,
    name: 'Unverified Email Write',
    collectionPath: '/users/user_a',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: false },
    payload: {
      uid: 'user_a',
      name: 'Alex',
      preferredUnits: 'metric',
      indoorOutdoorPreference: 'both',
      preferredDuration: 20,
      subscriptionTier: 'free',
      onboardingCompleted: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-Tenant Profile Read (PII Leak)',
    collectionPath: '/users/user_b',
    operation: 'get',
    auth: { uid: 'user_a', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Profile',
    collectionPath: '/users/user_a',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      uid: 'user_a',
      name: 'Alex',
      preferredUnits: 'metric',
      indoorOutdoorPreference: 'both',
      preferredDuration: 20,
      subscriptionTier: 'free',
      onboardingCompleted: true,
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'UID Spoofing in Subcollection',
    collectionPath: '/users/user_a/activityLogs/log_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      uid: 'user_b',
      title: 'Walk',
      category: 'walk',
      plannedDuration: 20,
      actualDuration: 20,
      outcome: 'completed_as_planned',
      effort: 'gentle',
      dateKey: '2026-10-04',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphaned Subcollection Write Without Parent User',
    collectionPath: '/users/non_existent_user/checkIns/chk_1',
    operation: 'create',
    auth: { uid: 'non_existent_user', email_verified: true },
    payload: {
      uid: 'non_existent_user',
      dateKey: '2026-10-04',
      feeling: 'Tired',
      availableMinutes: 15,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Timestamp Forgery',
    collectionPath: '/users/user_a/activityLogs/log_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      uid: 'user_a',
      title: 'Walk',
      category: 'walk',
      plannedDuration: 20,
      actualDuration: 20,
      outcome: 'completed_as_planned',
      effort: 'gentle',
      dateKey: '2026-10-04',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable Field Mutation on Update',
    collectionPath: '/users/user_a',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      uid: 'user_b',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial-of-Wallet String Overflow',
    collectionPath: '/users/user_a/activityLogs/log_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      uid: 'user_a',
      title: 'Walk',
      category: 'walk',
      plannedDuration: 20,
      actualDuration: 20,
      outcome: 'completed_as_planned',
      effort: 'gentle',
      notes: 'x'.repeat(2000),
      dateKey: '2026-10-04',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unbounded Array Poisoning',
    collectionPath: '/users/user_a',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      goals: new Array(50).fill('Move more'),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Array Element Type Poisoning',
    collectionPath: '/users/user_a',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      goals: [99999],
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Path ID Poisoning',
    collectionPath: '/users/user_a/activityLogs/invalid$id!@#',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Invalid Enum Value on Subscription Tier',
    collectionPath: '/users/user_a',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      subscriptionTier: 'enterprise_hack',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
