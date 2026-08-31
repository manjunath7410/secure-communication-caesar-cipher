# Viva Voce & Academic Defense Preparation Guide
# Secure Military Communication Platform

---

## ⚠️ Essential Exam Disclaimer
> **EXAMINER NOTE:**  
> When presenting this project, always clarify upfront: *"The Caesar Cipher is an educational, historical algorithm with an effective keyspace of 25 shifts and ~4.70 bits of entropy. It is computationally broken. This project demonstrates how historical cryptographic algorithms operate and how modern defense-in-depth software architectures (JWT, PBKDF2, App Lock, Biometrics, Zero-Plaintext Storage, Capacitor Android) are engineered around client-side mathematical engines."*

---

## Category A: Classical Cryptography & Mathematics

### Q1: What is the mathematical formulation of the Caesar Cipher?
**Answer:**  
The Caesar Cipher is a monoalphabetic substitution cipher over the ring of integers modulo 26 ($\mathbb{Z}_{26}$).
- **Encryption Function:** $E_k(p) = (p + k) \pmod{26}$
- **Decryption Function:** $D_k(c) = (c - k) \pmod{26} = (c + (26 - (k \bmod 26))) \pmod{26}$  
where $p$ is the numerical value of the plaintext character ($0 \dots 25$), $c$ is the ciphertext character, and $k \in \mathbb{Z}_{26}$ is the secret shift key.

---

### Q2: What is the keyspace size and entropy of the Caesar Cipher?
**Answer:**  
The total keyspace size is $|\mathcal{K}| = 26$ (including the trivial identity key $k=0$, leaving 25 active cryptographic keys).  
The information entropy $H(K)$ is calculated as:
$$H(K) = \log_2(26) \approx 4.7004 \text{ bits}$$
In contrast, AES-128 has $2^{128}$ keys ($\approx 128 \text{ bits}$ of entropy), making brute-force attacks against AES computationally impossible, whereas the Caesar Cipher can be exhausted in less than 1 millisecond.

---

### Q3: Why is ROT13 considered an "involution"?
**Answer:**  
An involution is a mathematical function that is its own inverse: $f(f(x)) = x$.  
In ROT13, the shift key is $k = 13$. Applying the cipher twice yields:
$$E_{13}(E_{13}(p)) = ((p + 13) + 13) \pmod{26} = (p + 26) \pmod{26} \equiv p$$
Therefore, $D_{13}(c) \equiv E_{13}(c)$. The exact same algorithm and code function performs both encryption and decryption.

---

### Q4: How does this project handle negative shift keys and large integers?
**Answer:**  
The engine normalizes all shift inputs using the formula:
$$\text{normalizedShift} = ((\text{shift} \bmod 26) + 26) \bmod 26$$
This guarantees that an input like $-3$ correctly maps to $23$, and $29$ maps to $3$.

---

## Category B: Cryptanalysis & Vulnerability Assessment

### Q5: How does the Automated Brute-Force Cryptanalysis module determine the correct plaintext without knowing the key?
**Answer:**  
The engine generates all 25 candidate plaintexts ($k=1$ to $k=25$) and evaluates each candidate using a **Frequency Correlation Score** ($S_k$):
$$S_k = \sum_{i=0}^{25} f_{\text{observed}}(i) \times f_{\text{standard}}(i)$$
where $f_{\text{standard}}$ represents the standard empirical letter frequencies of the English language ($E \approx 12.7\%, T \approx 9.1\%$). It also tokenizes the words and matches them against an English dictionary. The candidate with the highest combined statistical score is ranked first.

---

### Q6: What is a Known-Plaintext Attack (KPA), and how does it break the Caesar Cipher?
**Answer:**  
In a Known-Plaintext Attack, the cryptanalyst possesses at least one character of plaintext $p$ and its corresponding ciphertext $c$. Because the Caesar Cipher is linear:
$$k = (c - p) \pmod{26}$$
A single known letter pair completely exposes the entire secret key $k$ and decrypts the entire message history.

---

### Q7: Explain Claude Shannon's principles of Confusion and Diffusion, and how the Caesar Cipher violates them.
**Answer:**  
- **Confusion:** Obscures the relationship between the secret key and the ciphertext. The Caesar Cipher provides minimal confusion because each key simply shifts letters by a fixed integer.
- **Diffusion:** Spreads the statistical characteristics of individual plaintext letters across the entire ciphertext (e.g., changing 1 bit in plaintext changes 50% of the ciphertext in AES). The Caesar Cipher has **zero diffusion**: changing one letter alters exactly one corresponding ciphertext letter, preserving the statistical frequency distribution of the plaintext.

---

## Category C: Full-Stack Architecture & Engineering

### Q8: Describe the overall architecture of this application.
**Answer:**  
The application uses a decoupled, layered full-stack architecture:
1. **Frontend:** React 19 SPA built with TypeScript, Vite, Tailwind CSS, and Lucide React icons.
2. **State & Security Providers:** Top-level Context providers (`ThemeProvider`, `AuthProvider`, `AppLockProvider`) orchestrating state and security barriers.
3. **Backend API:** Node.js Express server (`server.ts`) bundling API endpoints and Vite static asset serving, with an optional Python FastAPI alternative.
4. **Mobile Bridge:** Capacitor 8 container packaging the web build into a native Android APK with hardware bridge access.

---

### Q9: What is the "Zero-Plaintext Storage Policy"?
**Answer:**  
The Zero-Plaintext Storage Policy is an architectural guarantee that plaintext messages exist exclusively in volatile client-side browser memory during active typing. The REST API payloads and database schemas explicitly reject plaintext fields; only `ciphertext`, `shift`, `charCount`, and non-sensitive operator `notes` are ever transmitted across the network or persisted to databases.

---

## Category D: Modern Application Security & Defensive Design

### Q10: How are user passwords securely stored?
**Answer:**  
Passwords are never stored in plaintext. They are hashed server-side using **PBKDF2 (Password-Based Key Derivation Function 2)** with HMAC-SHA256, 100,000 iterations, and a unique 16-byte cryptographically secure random salt per user. Hash comparison uses `crypto.timingSafeEqual` to prevent side-channel timing attacks.

---

### Q11: How does the client-side App Lock PIN work without compromising security?
**Answer:**  
The 6-digit PIN is hashed directly in the browser using the Web Crypto API (`window.crypto.subtle`) with PBKDF2-SHA256 and 100,000 iterations. Verification compares byte buffers in constant time. If an attacker inputs incorrect PINs repeatedly, the app enforces an exponential lockout penalty (3 fails $\rightarrow$ 10s, 5 fails $\rightarrow$ 30s, 8 fails $\rightarrow$ 60s).

---

### Q12: What does Android `FLAG_SECURE` accomplish?
**Answer:**  
In the Capacitor Android runtime, setting the window flag `WindowManager.LayoutParams.FLAG_SECURE` prevents the operating system and other apps from taking screenshots or screen recordings of the app. It also blanks out the app's preview in the Android multi-tasking / recent apps switcher.

---

## Category E: Quick Mathematical Reference

| Character | ASCII Decimal | $\mathbb{Z}_{26}$ Value | Character | ASCII Decimal | $\mathbb{Z}_{26}$ Value |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **A / a** | 65 / 97 | 0 | **N / n** | 78 / 110 | 13 |
| **B / b** | 66 / 98 | 1 | **O / o** | 79 / 111 | 14 |
| **C / c** | 67 / 99 | 2 | **P / p** | 80 / 112 | 15 |
| **D / d** | 68 / 100 | 3 | **Q / q** | 81 / 113 | 16 |
| **E / e** | 69 / 101 | 4 | **R / r** | 82 / 114 | 17 |
| **F / f** | 70 / 102 | 5 | **S / s** | 83 / 115 | 18 |
| **G / g** | 71 / 103 | 6 | **T / t** | 84 / 116 | 19 |
| **H / h** | 72 / 104 | 7 | **U / u** | 85 / 117 | 20 |
| **I / i** | 73 / 105 | 8 | **V / v** | 86 / 118 | 21 |
| **J / j** | 74 / 106 | 9 | **W / w** | 87 / 119 | 22 |
| **K / k** | 75 / 107 | 10 | **X / x** | 88 / 120 | 23 |
| **L / l** | 76 / 108 | 11 | **Y / y** | 89 / 121 | 24 |
| **M / m** | 77 / 109 | 12 | **Z / z** | 90 / 122 | 25 |
