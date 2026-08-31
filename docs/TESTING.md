# Testing Strategy, Test Suites & QA Documentation
# Secure Military Communication Platform

---

## 1. Testing Philosophy & Framework Architecture

The **Secure Military Communication** platform incorporates an automated multi-tier test suite executed via TypeScript (`tsx src/tests/runAllTests.ts`).

### Test Suite Execution Command
```bash
npm test
```

### Test Categories
1. **Unit & In-Memory Tests (Offline):** Validate mathematical correctness, cipher transformations, string boundary conditions, dashboard state mutations, brute-force heuristics, and PWA manifest compliance without requiring an active network server.
2. **Integration & API Tests (Live Server):** Validate HTTP REST endpoints, JWT authorization headers, duplicate registration rejection, rate limiting, and user isolation against an active backend server instance on `http://localhost:3000` or `http://localhost:8000`.

---

## 2. Test Phase Inventory & Detailed Scenarios

### Phase 1: Mathematical Foundations & Shift Normalization
- **T1.1:** Positive in-range integer shift ($k=3$) preserves value $3$.
- **T1.2:** Large positive out-of-range integer shift ($k=29$) normalizes to $k=3$ via $((29 \bmod 26) + 26) \bmod 26$.
- **T1.3:** Negative integer shift ($k=-3$) normalizes to $k=23$ ($26 - 3$).
- **T1.4:** Boundary shift ($k=26$) normalizes to identity shift $k=0$.
- **T1.5:** Multi-cycle boundary shift ($k=52$) normalizes to $k=0$.

### Phase 2: Caesar Cipher Core Engine
- **T2.1:** Empty string input returns empty string without exceptions.
- **T2.2:** Known vector encryption: `"ATTACK AT DAWN"` ($k=3$) $\rightarrow$ `"DWWDFN DW GDZQ"`.
- **T2.3:** Letter casing preservation: `"Attack At Dawn"` ($k=3$) $\rightarrow$ `"Dwwdfn Dw Gdzq"`.
- **T2.4:** ROT13 involution: `"Hello World!"` ($k=13$) $\rightarrow$ `"Uryyb Jbeyq!"`.
- **T2.5:** Identity shift ($k=0$) returns unaltered plaintext.
- **T2.6:** Special characters, punctuation, and digits (`"123!@#"` ) pass through unaltered.
- **T2.7:** Multi-line strings, tabs, and newlines (`\n`, `\r\n`) maintain exact spacing.
- **T2.8:** Alphabet boundary wrapping: `"XYZ"` ($k=3$) $\rightarrow$ `"ABC"`, `"A"` ($k=25$) $\rightarrow$ `"Z"`.
- **T2.9:** High-volume throughput: 11,000+ character payloads encrypt and decrypt without truncation or memory leaks.

### Phase 3: Mathematical Round-Trip Identity Invariant
- **T3.1:** Exhaustive proof of identity $\forall k \in [0, 25]$:
  $$D_k(E_k(P)) \equiv P$$
  Verified across 26 distinct shift keys for standard, alphanumeric, and mixed-case test payloads.

### Phase 5: Operations Dashboard & State Telemetry
- **T5.1:** Initialization returns non-negative telemetry counters.
- **T5.2:** Logging an encryption event increments `totalEncryptions` and `totalOperations` by 1.
- **T5.3:** Logging a decryption event increments `totalDecryptions` and `totalOperations` by 1.
- **T5.4:** Shift state mutations correctly update active shift indicator.
- **T5.5:** Activity log maintains chronological order with newest events at index 0.

### Phase 6: Authentication & Security Subsystem (Live Server Required)
- **T6.1:** Successful operator registration returns HTTP 201 with JWT token.
- **T6.2:** Duplicate email registration is rejected with HTTP 409 Conflict.
- **T6.3:** Successful login with valid credentials returns HTTP 200 and user profile.
- **T6.4:** Invalid login credentials return HTTP 401 Unauthorized.
- **T6.5:** Protected profile endpoint (`GET /api/v1/auth/me`) validates Bearer token.
- **T6.6:** Session logout revokes client-side tokens and clears authorization state.

### Phase 7: Encrypted Message Vault (Live Server Required)
- **T7.1:** Unauthenticated access to `GET /messages` returns HTTP 401 Unauthorized.
- **T7.2:** Authenticated operator can persist encrypted ciphertext to vault (Zero Plaintext).
- **T7.3:** User isolation: Operator Odin cannot query or view Operator Sentinel's records.
- **T7.4:** Cross-user message retrieval (`GET /messages/{other_user_id}`) returns HTTP 403 Forbidden.
- **T7.5:** Cross-user message deletion (`DELETE /messages/{other_user_id}`) returns HTTP 403 Forbidden.
- **T7.6:** Operator can successfully delete their own vaulted messages.

### Phase 8: Automated Brute-Force Cryptanalysis
- **T8.1:** Generates exactly 26 candidate permutations ($k=0$ through $k=25$).
- **T8.2:** Candidate at shift $k=0$ matches the raw ciphertext.
- **T8.3:** Recovers `"ATTACK AT DAWN"` from ciphertext `"DWWDFN DW GDZQ"` at shift $k=3$.
- **T8.4:** Recovers `"Hello World!"` from ROT13 ciphertext `"Uryyb Jbeyq!"` with `isRot13` flag.
- **T8.5:** Preserves symbols, digits, and mixed casing across all 26 permutations.
- **T8.6:** Reports theoretical keyspace entropy metric ($\approx 4.70$ bits).

### Phase 9: Progressive Web App & Offline Execution
- **T9.1:** Web App Manifest compliance (`manifest.json` standalone mode and theme definitions).
- **T9.2:** Icon specifications defined for 192px and 512px maskable icons.
- **T9.3:** Service worker security rule: sensitive auth and token routes bypass SW caching.
- **T9.4:** Pure offline execution: Caesar cipher runs 100% in-memory with zero network connectivity.

---

## 3. Running Automated Tests

### Step 1: Execute Standalone Unit Tests
```bash
npm test
```

### Step 2: Execute Full Integration Test Suite (with Backend)
In Terminal 1 (Start Server):
```bash
npm run dev
```

In Terminal 2 (Run Tests):
```bash
npm test
```
