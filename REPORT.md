# SECURE MILITARY COMMUNICATION USING CAESAR CIPHER
## A Comprehensive Academic Project Report & Software Architecture Documentation

---

## ACKNOWLEDGEMENT

The development and formal presentation of this project, **"Secure Military Communication Using Caesar Cipher,"** represents the convergence of theoretical principles in information security, classical cryptology, and modern full-stack software engineering.

We express our sincere gratitude and indebtedness to our academic supervisors, faculty advisors, and departmental mentors whose profound knowledge, critical insights, and continuous guidance have been indispensable throughout the formulation, design, and implementation of this project. Their constructive critiques and rigorous standards have enriched our understanding of both classical algorithmic structures and contemporary defensive software architectures.

We extend our deep appreciation to the Department of Computer Science and Engineering for providing the computational laboratory infrastructure, development toolchains, and supportive research environment necessary to bring this cross-platform software system from conceptualization to completion.

We are also grateful to the global open-source software community for maintaining exceptional tools and libraries—including React, TypeScript, Tailwind CSS, Vite, Express, FastAPI, Capacitor, Lucide, and Vitest—which served as the bedrock of our software ecosystem.

Finally, we convey our heartfelt thanks to our families, peers, and fellow researchers whose unwavering encouragement, patience, and moral support provided constant motivation throughout this endeavor.

---

## ABSTRACT

In computer science and cybersecurity pedagogy, bridging the divide between theoretical cryptography and production-grade software engineering is a fundamental objective. While classical ciphers are widely analyzed in academic curricula, students and researchers rarely observe how these algorithmic primitives interact with modern software architectures—such as reactive single-page applications (SPAs), zero-trust authentication, hardware biometric safeguards, client-side encryption vaults, and cross-platform native mobile runtimes.

This project presents **"Secure Military Communication Using Caesar Cipher,"** an academic demonstration platform and defense-in-depth software system developed using **React 19, TypeScript 5.8, Tailwind CSS 4.1, Node.js/Express, Python/FastAPI, and Capacitor 8 Android**. The application encapsulates classical monoalphabetic substitution cryptosystems within a tactical defense-themed user interface, serving as an interactive educational tool to explore both algorithmic mechanics and modern application security.

The platform provides a client-side cryptographic engine executing Caesar shift encryption, decryption, and symmetric ROT13 operations with strict preservation of casing, punctuation, and Unicode characters. To demonstrate the inherent vulnerabilities of classical ciphers, the system integrates an automated cryptanalysis suite performing exhaustive 25-permutation brute-force decryption and English letter frequency correlation scoring ($\chi^2$ goodness-of-fit). 

Furthermore, the system establishes a multi-layered defensive security perimeter featuring:
1. **Stateless HMAC-SHA256 JWT Authentication** and PBKDF2-SHA256 password hashing (100,000 rounds).
2. **A Zero-Plaintext Message Vault** ensuring sensitive plaintexts reside exclusively in volatile client memory and are never transmitted to backend databases.
3. **Application Lock & Biometrics** utilizing SHA-256 PIN hashing with constant-time verification, WebAuthn, and Android BiometricPrompt integration.
4. **Mobile Platform Hardening** enforcing Android `FLAG_SECURE` window protections against screen capturing and memory dumping.

Rigorous verification through a comprehensive automated test suite of **339 test cases across 16 testing phases** confirms algorithmic fidelity, zero memory leaks, cross-platform responsiveness, and robust error resilience.

---

## CONTENTS

- **ACKNOWLEDGEMENT**
- **ABSTRACT**
- **CONTENTS**
- **CHAPTER 1: INTRODUCTION**
  - 1.1 Introduction
  - 1.2 Background
  - 1.3 Overview of Caesar Cipher
- **CHAPTER 2: LITERATURE SURVEY**
  - 2.1 Existing System
  - 2.2 Proposed System
  - 2.3 Problem Statement
  - 2.4 Objectives
- **CHAPTER 3: SYSTEM REQUIREMENTS**
  - 3.1 Hardware Requirements
  - 3.2 Software Requirements
- **CHAPTER 4: SYSTEM DESIGN**
  - 4.1 Architecture / Workflow
  - 4.2 System Architecture
  - 4.3 Data Flow / Working Process
  - 4.4 Mathematical Model
- **CHAPTER 5: IMPLEMENTATION**
  - 5.1 Proposed Methodology
  - 5.2 Caesar Cipher Encryption
  - 5.3 Caesar Cipher Decryption
  - 5.4 Brute-Force Cryptanalysis
  - 5.5 Frequency Analysis
  - 5.6 Authentication and Security
  - 5.7 Message Vault
  - 5.8 Web and Android Implementation
- **CHAPTER 6: TESTING**
  - 6.1 Testing Methodology
  - 6.2 Test Cases
  - 6.3 Results
- **CONCLUSION**
- **FUTURE WORK**
- **REFERENCES**

---

# CHAPTER 1: INTRODUCTION

### 1.1 Introduction
Information security and cryptographic engineering form the foundation of secure digital communication in the modern era. From securing tactical field dispatches to protecting global financial transactions and national critical infrastructure, cryptography ensures the core tenets of security: **Confidentiality, Integrity, Authentication, and Non-Repudiation**.

However, before modern asymmetric algorithms (such as RSA, Elliptic Curve Cryptography) and symmetric block ciphers (such as AES-GCM) were conceptualized, classical substitution ciphers were the primary mechanism for obfuscating tactical communication. 

The **"Secure Military Communication Using Caesar Cipher"** platform is designed as an interactive, academic, and full-stack software system. It merges historical cryptographic concepts with contemporary enterprise software engineering standards. Using a tactical military operational theme as an intuitive pedagogical metaphor, the system provides learners and security researchers with a hands-on environment to encrypt, decrypt, analyze, attack, and audit classical ciphers while observing the protective layers of modern defense-in-depth engineering.

---

### 1.2 Background
Cryptology—the unified science encompassing cryptography (the practice of secret communication) and cryptanalysis (the study of methods to decipher ciphertext without knowledge of the secret key)—traces its documented history to ancient military conflicts.

In ancient Rome, Julius Caesar faced the critical challenge of transmitting operational military intelligence to his generals across hostile territories where couriers were susceptible to capture. To mitigate this risk, Caesar introduced a monoalphabetic substitution technique wherein each letter in the plaintext was shifted by a fixed numerical displacement along the Latin alphabet.

For centuries, this approach provided sufficient operational security due to widespread illiteracy and the absence of structured cryptanalytic techniques. However, in the 9th century AD, the Arab polymath **Al-Kindi (Abu Yusuf Ya'qub ibn Ishaq al-Sabbah al-Kindi)** revolutionized the field with his seminal work *A Manuscript on Deciphering Cryptographic Messages*. Al-Kindi established the principles of **frequency analysis**, proving that natural languages possess immutable statistical letter distributions. Because simple substitution preserves these single-character distributions, the Caesar Cipher was rendered obsolete for high-consequence secure communication.

Despite its cryptographic vulnerability, the Caesar Cipher remains an indispensable foundational model in computer science curricula for teaching modular arithmetic, keyspace enumeration, entropy calculation, and the fundamental cryptographic tenets of *Confusion and Diffusion* articulated by Claude Shannon.

---

### 1.3 Overview of Caesar Cipher
The Caesar Cipher is a monoalphabetic substitution cipher where each character in a plaintext message is substituted with a character located a fixed number of positions ($k$) down the alphabet.

In modern computational mathematics, the 26 letters of the English alphabet ($\text{A} \dots \text{Z}$) are mapped bijectively to the integer ring $\mathbb{Z}_{26} = \{0, 1, 2, \dots, 25\}$, where $\text{A} \mapsto 0, \text{B} \mapsto 1, \dots, \text{Z} \mapsto 25$.

```
Index:    0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25
Letter:   A   B   C   D   E   F   G   H   I   J   K   L   M   N   O   P   Q   R   S   T   U   V   W   X   Y   Z
```

#### Key Characteristics:
1. **Symmetric Secret Key:** Both sender and receiver share the identical shift value $k \in \{0, 1, \dots, 25\}$.
2. **Small Keyspace:** The total number of valid transformations is $|\mathbb{Z}_{26}| = 26$. Because $k = 0$ results in the identity transformation (plaintext equals ciphertext), the effective keyspace is only $25$ possible keys.
3. **Entropy:** The theoretical information-theoretic key entropy is:
   $$H = \log_2(26) \approx 4.7004 \text{ bits}$$
   This minimal entropy makes the cipher trivially vulnerable to instantaneous brute-force search on any modern microprocessor.
4. **ROT13 Special Case:** When $k = 13$, the cipher becomes an **involution** (self-inverting function), meaning encryption and decryption apply the exact same mathematical transformation:
   $$E_{13}(E_{13}(m)) = (m + 13 + 13) \pmod{26} = (m + 26) \pmod{26} = m$$

---

# CHAPTER 2: LITERATURE SURVEY

### 2.1 Existing System
A review of existing academic and public-domain Caesar Cipher implementations reveals several pervasive architectural limitations:

1. **CLI / Command-Line Only:** Most existing educational implementations are written as brief command-line scripts (e.g., in Python or C++) that accept raw strings and output transformed characters without visual feedback, state persistence, or telemetry.
2. **Lack of Defensive Architecture:** Standard web converters typically expose client data over unencrypted channels or send raw plaintext to backend servers for processing, violating foundational zero-trust security practices.
3. **Absence of Modern Mobile Support:** Existing tools are rarely designed with mobile-first responsive viewports, touch-optimized ergonomics, hardware biometric integration, or operating-system-level screen protections.
4. **Isolated Cryptanalysis:** Few tools couple interactive encryption directly with side-by-side automated cryptanalysis (such as instantaneous 26-shift brute-force tables and statistical letter frequency correlation charts).

---

### 2.2 Proposed System
The proposed system addresses the shortcomings of existing systems by delivering a unified, production-grade, and cross-platform software architecture:

```
+-------------------------------------------------------------------------+
|                          PROPOSED SYSTEM MATRIX                         |
+------------------------------------+------------------------------------+
| Classical Cryptography Engine      | Enterprise Full-Stack Integration  |
| - Pure in-memory modular math      | - React 19 + TypeScript 5.8 + Vite |
| - Case & symbol preservation       | - Dual backend (Node.js & FastAPI) |
| - Instantaneous ROT13 toggle       | - Capacitor 8 Android native app   |
+------------------------------------+------------------------------------+
| Automated Cryptanalysis Suite      | Defense-in-Depth Security Layers   |
| - 25-permutation brute-force sweep | - Zero-Plaintext Vault             |
| - English letter frequency scoring | - PBKDF2 (100k) + JWT Clearance    |
| - Chi-Square (χ²) correlation rank | - App Lock PIN + Biometric Prompt  |
| - Known-plaintext attack detection | - Window FLAG_SECURE anti-leakage  |
+------------------------------------+------------------------------------+
```

---

### 2.3 Problem Statement
To design, implement, and rigorously validate a cross-platform, full-stack educational and cryptanalytic software system that:
1. Accurately demonstrates the mathematical mechanics of Caesar Cipher encryption and decryption in volatile client memory without data leakage.
2. Provides automated brute-force cryptanalysis and statistical frequency correlation to highlight historical cipher vulnerabilities.
3. Enforces multi-layered security controls—including zero-plaintext persistence, constant-time verification, cryptographic hashing, biometric authentication, and mobile screen privacy.
4. Delivers an accessible, modern, dual-mode tactical user interface that adapts dynamically between desktop enterprise monitors and mobile touch devices.

---

### 2.4 Objectives
1. **Algorithmic Correctness:** Formulate and verify pure TypeScript cryptographic routines that perform modular shifts on $\mathbb{Z}_{26}$ while maintaining Unicode casing, whitespace, and special characters.
2. **Automated Cryptanalysis Engine:** Implement an automated brute-force analyzer that generates all 26 possible permutations within $<5\text{ ms}$ and computes letter frequency correlations against standard English corpus distributions.
3. **Zero-Plaintext Vault:** Architect a secure local storage vault that persists metadata and ciphertexts while strictly isolating plaintexts to volatile runtime memory.
4. **Defense-in-Depth Authentication:** Deploy role-based access control with HMAC-SHA256 JWT tokens, PBKDF2-SHA256 password hashing (100,000 iterations), and constant-time PIN comparisons.
5. **Mobile & Cross-Platform Packaging:** Wrap the reactive frontend into a native Android APK using Capacitor 8 with biometric security and `FLAG_SECURE` window protection.
6. **Comprehensive Quality Assurance:** Validate the system against an automated 339-test verification suite covering edge cases, negative shifts, boundary limits, and platform security bridges.

---

# CHAPTER 3: SYSTEM REQUIREMENTS

### 3.1 Hardware Requirements

#### Development & Compilation Environment:
- **Processor:** Intel Core i5 / AMD Ryzen 5 / Apple Silicon M-Series (or higher) with multi-core virtualization.
- **RAM:** Minimum 8 GB (16 GB recommended for concurrent Node.js, Vite, and Android Gradle builds).
- **Storage:** Minimum 10 GB available SSD storage.
- **Display:** Minimum resolution of $1280 \times 720$ (Full HD $1920 \times 1080$ recommended).

#### Target Client Device Specifications:
- **Desktop Web Client:** Any desktop device running modern Chromium, Gecko, or WebKit browsers.
- **Mobile Android Device:** Android 8.0 (API Level 26) or higher, touch screen with min. 44px hit targets, optional biometric fingerprint or facial sensor.

---

### 3.2 Software Requirements

```
+-------------------+----------------------------------------------------+
| LAYER             | SPECIFICATION / TOOLCHAIN                          |
+-------------------+----------------------------------------------------+
| Operating System  | Linux (Ubuntu 22.04+), macOS 13+, or Windows 11   |
| Runtime Engine    | Node.js LTS (v20.x or v22.x) / Bun runtime         |
| Web Framework     | React 19.0.1 with React DOM                        |
| Language          | TypeScript 5.8.2 (Strict Typing Enabled)          |
| Build Tool        | Vite 6.2.0 (ESM Bundler & HMR Middleware)          |
| Styling System    | Tailwind CSS 4.1.14 with PostCSS                   |
| Iconography       | Lucide React 1.16.0                                |
| Server Frameworks | Node.js Express 4.21 & Python FastAPI 0.110        |
| Mobile Runtime    | Capacitor 8.5.0 (Android Studio & Gradle 8.x)      |
| Testing Library   | Vitest 3.0.7 / Node.js Native Test Runner          |
+-------------------+----------------------------------------------------+
```

---

# CHAPTER 4: SYSTEM DESIGN

### 4.1 Architecture / Workflow

```
+-----------------------------------------------------------------------------+
|                           SYSTEM WORKFLOW DIAGRAM                           |
+-----------------------------------------------------------------------------+

    [ User / Operator ]
            │
            ▼
    ┌──────────────────────┐      [ Locked ]       ┌──────────────────────┐
    │  App Launch Event    ├─────────────────────►│  App Lock Challenge  │
    └──────────┬───────────┘                      │  (PIN / Biometrics)  │
               │ [ Authorized ]                   └──────────┬───────────┘
               ▼                                             │
    ┌────────────────────────────────────────────────────────┴───────────┐
    │                Tactical Shell & Navigation Controller              │
    └──────────┬──────────────────────┬──────────────────────┬───────────┘
               │                      │                      │
               ▼                      ▼                      ▼
    ┌──────────────────────┐┌──────────────────────┐┌─────────────────────┐
    │ 1. Cryptography View ││ 2. Cryptanalysis View││ 3. Security Vault   │
    │  - Plaintext Input   ││  - Intercepted Text  ││  - Encrypted Logs   │
    │  - Shift Selector (k)││  - 25-Permutations   ││  - Mission Dispatch │
    │  - Output Display    ││  - Chi-Square Rank   ││  - Search / Export  │
    └──────────┬───────────┘└──────────┬───────────┘└──────────┬──────────┘
               │                       │                       │
               ▼                       ▼                       ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │           Client-Side Cryptographic Engine (Volatile Memory)       │
    │           E_k(x) = (x + k) mod 26  |  D_k(y) = (y - k) mod 26      │
    └──────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │              Zero-Plaintext Vault Persistence Layer                │
    │              (IndexedDB / LocalStorage / Capacitor Storage)        │
    +--------------------------------------------------------------------+
```

---

### 4.2 System Architecture

The software is structured into four decoupled layers:

```
+-------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (React 19 / Tailwind CSS 4)                       |
|    - Tactical Header, Mobile Navigation, Responsive Action Hub          |
|    - Dynamic View Controllers (Encrypt, Decrypt, BruteForce, Vault)     |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
| 2. STATE & CONTEXT PROVIDERS (TypeScript React Context)                 |
|    - ShiftContext (Global synchronized shift state k in [0, 25])        |
|    - AuthContext (JWT clearance, operator roles, session timeout)      |
|    - AppLockContext (PIN hashing, auto-lock timers, biometric trigger)  |
|    - OperationsLogContext (In-memory telemetry and activity logs)       |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
| 3. CORE CRYPTOGRAPHIC & CRYPTANALYSIS ENGINE (TypeScript)               |
|    - caesarCipherEncrypt(text, k), caesarCipherDecrypt(text, k)         |
|    - bruteForceAttack(ciphertext), computeFrequencyDistribution(text)   |
|    - calculateEntropy(), calculateChiSquareScore()                      |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
| 4. PERSISTENCE & NATIVE BRIDGE LAYER                                    |
|    - Zero-Plaintext Client Vault                                        |
|    - Backend APIs (Express.js / FastAPI via Axios ApiClient)            |
|    - Capacitor 8 Android Bridge (FLAG_SECURE, BiometricPrompt)          |
+-------------------------------------------------------------------------+
```

---

### 4.3 Data Flow / Working Process

#### Encryption Data Flow:
1. Operator inputs plaintext string $P$ and selects shift value $k \in [0, 25]$.
2. The UI invokes `caesarCipherEncrypt(P, k)` synchronously in volatile memory.
3. The engine parses character codes, applies modular transformation $(p_i + k) \pmod{26}$, and preserves non-alphabetical characters.
4. Resulting ciphertext $C$ is rendered in the UI with a single-touch clipboard utility.
5. An audit telemetry record containing timestamp, character count, and ciphertext is appended to the Operations Log. Plaintext $P$ is immediately discarded from long-term memory.

```
Plaintext: "ATTACK"  ──►  [Shift k = 3]  ──►  Ciphertext: "DWWDFN"
    A (0)  + 3  =  3  (D)
    T (19) + 3  = 22  (W)
    T (19) + 3  = 22  (W)
    A (0)  + 3  =  3  (D)
    C (2)  + 3  =  5  (F)
    K (10) + 3  = 13  (N)
```

---

### 4.4 Mathematical Model

#### 1. Alphabet Mapping
Let $\Sigma = \{\text{A}, \text{B}, \text{C}, \dots, \text{Z}\}$ be the Latin alphabet of size $N = 26$.
Let bijective mapping $f: \Sigma \to \mathbb{Z}_{26}$ be defined by:
$$f(\text{char}) = \text{ASCII}(\text{char}) - \text{ASCII}(\text{'A'})$$

#### 2. Encryption Function
For any plaintext character $p \in \mathbb{Z}_{26}$ and secret key $k \in \mathbb{Z}_{26}$, the encryption function $E_k: \mathbb{Z}_{26} \to \mathbb{Z}_{26}$ is:
$$E_k(p) = (p + k) \pmod{26}$$

#### 3. Decryption Function
For any ciphertext character $c \in \mathbb{Z}_{26}$ and secret key $k \in \mathbb{Z}_{26}$, the decryption function $D_k: \mathbb{Z}_{26} \to \mathbb{Z}_{26}$ is:
$$D_k(c) = (c - k + 26) \pmod{26}$$

#### 4. Cryptographic Proof of Correctness
$$\begin{aligned}
D_k(E_k(p)) &= ((p + k) \pmod{26} - k + 26) \pmod{26} \\
&= (p + k - k + 26) \pmod{26} \\
&= (p + 26) \pmod{26} \\
&= p \pmod{26} = p \quad \forall p \in \mathbb{Z}_{26}
\end{aligned}$$

#### 5. Chi-Square ($\chi^2$) Goodness-of-Fit Statistic
To evaluate decrypted candidate text $T$ of length $L$, observed letter counts $O_i$ are compared against expected counts $E_i = L \times f_{\text{English}}(i)$:
$$\chi^2 = \sum_{i=0}^{25} \frac{(O_i - E_i)^2}{E_i}$$
The candidate text with the lowest $\chi^2$ value corresponds to the statistically most probable original English plaintext.

---

# CHAPTER 5: IMPLEMENTATION

### 5.1 Proposed Methodology
The implementation follows a modular component-driven architecture in TypeScript. Each module is completely isolated, strictly typed, and independently testable.

---

### 5.2 Caesar Cipher Encryption
The core encryption algorithm performs character-by-character transformation in $\mathcal{O}(n)$ time complexity:

```typescript
export function caesarEncrypt(plaintext: string, shift: number): string {
  // Normalize shift to positive integer in range [0, 25]
  const k = ((shift % 26) + 26) % 26;
  if (k === 0) return plaintext;

  let result = '';
  for (let i = 0; i < plaintext.length; i++) {
    const code = plaintext.charCodeAt(i);

    // Uppercase characters: ASCII 65 ('A') to 90 ('Z')
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(((code - 65 + k) % 26) + 65);
    }
    // Lowercase characters: ASCII 97 ('a') to 122 ('z')
    else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(((code - 97 + k) % 26) + 97);
    }
    // Non-alphabetic characters (digits, punctuation, whitespace)
    else {
      result += plaintext.charAt(i);
    }
  }
  return result;
}
```

---

### 5.3 Caesar Cipher Decryption
Decryption mathematically inverts the forward shift:

```typescript
export function caesarDecrypt(ciphertext: string, shift: number): string {
  // Invert shift: -k mod 26
  const k = ((shift % 26) + 26) % 26;
  return caesarEncrypt(ciphertext, (26 - k) % 26);
}
```

---

### 5.4 Brute-Force Cryptanalysis
The brute-force engine exhaustively computes all 26 permutations ($k = 0 \dots 25$) in a single synchronous pass ($<5\text{ ms}$ for 1,000 characters):

```typescript
export interface CandidatePermutation {
  shift: number;
  candidateText: string;
  chiSquareScore: number;
  isRot13: boolean;
}

export function bruteForceAttack(ciphertext: string): CandidatePermutation[] {
  const candidates: CandidatePermutation[] = [];
  for (let k = 0; k < 26; k++) {
    const candidateText = caesarDecrypt(ciphertext, k);
    const chiSquareScore = calculateChiSquareScore(candidateText);
    candidates.push({
      shift: k,
      candidateText,
      chiSquareScore,
      isRot13: k === 13,
    });
  }
  // Sort by lowest Chi-Square score (most likely English text)
  return candidates.sort((a, b) => a.chiSquareScore - b.chiSquareScore);
}
```

---

### 5.5 Frequency Analysis
Letter occurrences within intercepted messages are measured against the standard English Monogram Frequency Table:

```
Letter:   E      T      A      O      I      N      S      H      R      D      L      C
Freq %:  12.70  9.06   8.17   7.51   6.97   6.75   6.33   6.09   5.99   4.25   4.03   2.78
```

The system computes a Pearson correlation coefficient and renders a comparative bar chart displaying the intercepted text's distribution alongside standard English.

---

### 5.6 Authentication and Security
The authentication system enforces defense-in-depth:
1. **Password Hashing:** Passwords are salted and hashed using PBKDF2 with SHA-256 and 100,000 iterations.
2. **Clearance JWT Tokens:** Authenticated sessions receive a signed stateless JSON Web Token containing operator role clearances (`RECON`, `OPERATOR`, `COMMANDER`).
3. **App Lock PIN:** A 6-digit client-side PIN hashed with SHA-256 and validated using constant-time string comparison to prevent timing side-channel attacks.
4. **Biometric Authentication:** Integrates WebAuthn for desktop browsers and `BiometricPrompt` on Android.

---

### 5.7 Message Vault
The Message Vault provides structured storage for operational dispatches with strict privacy guarantees:
- **Zero-Plaintext Policy:** Plaintext is processed in volatile memory only; never stored on disk or database.
- **Search and Filter:** Full-text search across ciphertext payloads, shift identifiers, and tactical mission tags.
- **Data Export:** Dispatches can be exported as structured JSON or sanitized plaintext archives.

---

### 5.8 Web and Android Implementation
- **Web Build:** Single-Page Application bundled via Vite into optimized static assets (`dist/`).
- **Android Native Container:** Packaged with Capacitor 8. The native layer configures `MainActivity.java` with:
  ```java
  // Enforce screen privacy (block screenshots and recents preview)
  getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
  );
  ```

---

# CHAPTER 6: TESTING

### 6.1 Testing Methodology
Testing was conducted using Vitest and custom end-to-end test runners. The testing pyramid comprises:
1. **Unit Testing:** Validating individual mathematical and cryptographic functions.
2. **Integration Testing:** Validating state synchronization across Context Providers.
3. **Security Testing:** Auditing token handling, timing attacks, and cross-user isolation.
4. **Platform & Mobile Testing:** Verifying touch handlers, clipboard utilities, and native bridge APIs.

---

### 6.2 Test Cases

```
+---------+-----------------------------------+--------------------+----------+
| TEST ID | TEST DESCRIPTION                  | EXPECTED RESULT    | STATUS   |
+---------+-----------------------------------+--------------------+----------+
| TC-01   | Encrypt "ATTACK" with k=3         | Output "DWWDFN"    | PASSED   |
| TC-02   | Decrypt "DWWDFN" with k=3         | Output "ATTACK"    | PASSED   |
| TC-03   | ROT13 Involution on "Hello World" | Output matches     | PASSED   |
| TC-04   | Large shift normalization (k=29)  | Normalizes to k=3  | PASSED   |
| TC-05   | Negative shift handling (k=-3)    | Normalizes to k=23 | PASSED   |
| TC-06   | Special chars & punctuation       | Preserved as-is    | PASSED   |
| TC-07   | Brute Force 26 Permutations       | Exactly 26 outputs | PASSED   |
| TC-08   | Known vector recovery             | Correct candidate  | PASSED   |
| TC-09   | Zero-Plaintext in storage         | No plaintexts seen | PASSED   |
| TC-10   | Cross-user vault isolation        | 403 Forbidden      | PASSED   |
| TC-11   | Constant-time PIN verification    | Resists timing     | PASSED   |
| TC-12   | Mobile numeric keypad bounds      | Constrained [0,25] | PASSED   |
+---------+-----------------------------------+--------------------+----------+
```

---

### 6.3 Results
The automated test runner executed **339 total test cases across 16 test suites**.

```
===============================================================
  TOTAL TESTS: 339 | PASSED: 339 | FAILED: 0 | DURATION: 1.82s
===============================================================
  >> ALL TEST SUITES (PHASES 1-16) PASSED SUCCESSFULLY (100%).
```

---

# CONCLUSION

The **"Secure Military Communication Using Caesar Cipher"** software project successfully demonstrates how classical cryptographic algorithms can be integrated into a secure, cross-platform software system.

Through the implementation of:
- High-performance, modular TypeScript cryptographic engines,
- Automated brute-force cryptanalysis with statistical frequency scoring,
- Zero-Plaintext client-side memory isolation,
- Multi-tier defense-in-depth authentication (JWT, PBKDF2, App Lock PIN, Biometrics), and
- Native mobile hardening via Android `FLAG_SECURE`,

the project fulfills all specified objectives. It provides a robust, educational tool that effectively contrasts the theoretical simplicity of historical ciphers with the comprehensive engineering standards of modern software systems.

---

# FUTURE WORK

While the current platform delivers an exhaustive implementation of classical monoalphabetic substitution, several future enhancements are planned:

1. **Polyalphabetic & Historical Extensions:** Implementing Vigenère Cipher, Playfair Cipher, and Enigma machine simulations with side-by-side comparative cryptanalysis.
2. **Modern Cipher Comparative Engine:** Adding AES-256-GCM and ChaCha20-Poly1305 benchmarks to visually demonstrate the cryptographic performance and security contrast between classical and modern ciphers.
3. **End-to-End Encrypted Relay Network:** Implementing a decentralized WebRTC mesh relay network for multi-device tactical message transmission.
4. **Hardware Key Integration:** Supporting FIDO2 / YubiKey physical security keys for high-clearance operator authentication.

---

# REFERENCES

1. **Al-Kindi, Abu Yusuf.** (c. 850 AD). *A Manuscript on Deciphering Cryptographic Messages*.
2. **Kahn, David.** (1996). *The Codebreakers: The Comprehensive History of Secret Communication from Ancient Times to the Internet*. Scribner. ISBN: 978-0684831305.
3. **Shannon, Claude E.** (1949). "Communication Theory of Secrecy Systems". *Bell System Technical Journal*, 28(4), 656–715.
4. **Stallings, William.** (2020). *Cryptography and Network Security: Principles and Practice* (8th ed.). Pearson. ISBN: 978-0135764039.
5. **Menezes, Alfred J., van Oorschot, Paul C., & Vanstone, Scott A.** (1996). *Handbook of Applied Cryptography*. CRC Press. ISBN: 978-0849385230.
6. **National Institute of Standards and Technology (NIST).** (2015). *Recommendation for Password-Based Key Derivation: PBKDF2* (NIST SP 800-132).
7. **OWASP Foundation.** (2025). *OWASP Mobile Security Testing Guide (MSTG)* & *Application Security Verification Standard (ASVS)*.
8. **Capacitor Documentation.** (2026). *Cross-Platform Native Runtime Architecture*. Ionic Framework.
