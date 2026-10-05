# Security Specification — Google Fit Adapt

## 1. Data Invariants
1. **Strict Tenant & PII Isolation**: Every user document `/users/{userId}` and all subcollections (`checkIns`, `activityLogs`, `foodLogs`, `medications`, `calendarEvents`) are strictly private to `request.auth.uid == userId` with `request.auth.token.email_verified == true`.
2. **Master Gate Relational Sync**: Every subcollection write (`create`, `update`, `delete`) and `get`/`list` verifies that the parent `/users/$(userId)` exists or belongs to `request.auth.uid`, and that incoming `uid == userId == request.auth.uid`.
3. **Strict Temporal Integrity**: Every `createdAt` must equal `request.time` on `create` and remain immutable on `update`. Every `updatedAt` must equal `request.time` on `create` and `update`.
4. **Volumetric & Key Guarding**: All string fields have explicit `.size()` bounds matching `firebase-blueprint.json`, all arrays have `.size() <= MAX` bounds and type validation on index 0 when non-empty, and all writes enforce `hasAll` / `hasOnly` key allowlists.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/users/{uid}`. (Rejected)
2. **Cross-Tenant Profile Read (PII Leak)**: User A (`uid: "user_a"`) attempting `get` or `list` on `/users/user_b`. (Rejected)
3. **Shadow Field Injection on Profile**: Creating `/users/{uid}` with an undeclared field `"isAdmin": true`. (Rejected by `hasOnly`)
4. **UID Spoofing in Subcollection**: User A creating `/users/user_a/activityLogs/log_1` with payload `uid: "user_b"`. (Rejected by `data.uid == request.auth.uid`)
5. **Orphaned Subcollection Write**: User A creating `/users/user_a/checkIns/chk_1` before `/users/user_a` parent document exists. (Rejected by `exists(/databases/$(database)/documents/users/$(userId))`)
6. **Timestamp Forgery**: User A creating `/users/user_a/activityLogs/log_1` with a past or future client `createdAt` timestamp instead of `request.time`. (Rejected by `incoming().createdAt == request.time`)
7. **Immutable Field Mutation**: User A updating `/users/user_a` and mutating `createdAt` or `uid`. (Rejected by `affectedKeys().hasOnly(...)` and `incoming().createdAt == existing().createdAt`)
8. **Denial-of-Wallet String Overflow**: User A submitting a 10,000-character `notes` string in `activityLogs`. (Rejected by `notes.size() <= 500`)
9. **Unbounded Array Poisoning**: User A submitting 500 items in `goals` array on `/users/user_a`. (Rejected by `goals.size() <= 10`)
10. **Array Element Type Poisoning**: User A submitting `[12345]` (number instead of string) in `goals`. (Rejected by `goals[0] is string`)
11. **Path ID Poisoning**: User A creating a document with a 300-character ID or special characters. (Rejected by `isValidId(id)`)
12. **Invalid Enum Value**: User A setting `subscriptionTier: "unlimited_hack"` on `/users/user_a`. (Rejected by enum check `in ['free', 'pro', 'pro_plus']`)
