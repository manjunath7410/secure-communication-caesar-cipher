# Contributing to Secure Military Communication Platform

Thank you for your interest in contributing to the **Secure Military Communication Using Caesar Cipher** project. This project is an open academic cryptography demonstration platform built with React 19, TypeScript, Vite, Tailwind CSS, Node.js/Express, FastAPI, and Capacitor Android.

---

## 1. Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please ensure interactions remain respectful, collaborative, and academically constructive.

---

## 2. Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.10+ (for FastAPI backend development, optional if running Express server)
- **Android Studio & SDK**: API Level 34+ (for Capacitor Android development)

### Getting Started
1. **Fork & Clone**:
   ```bash
   git clone https://github.com/your-username/secure-military-communication.git
   cd secure-military-communication
   ```

2. **Install Frontend & Server Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 3. Branching & Commit Conventions

### Branch Naming
- `feat/feature-name` — New feature or algorithm extension
- `fix/bug-description` — Bug fix or error resolution
- `docs/documentation-update` — Documentation, reports, or viva notes
- `test/test-suite-name` — Adding or refining test suites
- `refactor/component-name` — Code restructuring without feature changes

### Commit Messages
Follow the **Conventional Commits** specification:
```
<type>(<scope>): <short summary in present tense>

[optional body explaining context and rationale]
```
Examples:
- `feat(crypto): add chi-squared metric to brute force scoring`
- `fix(auth): correct token expiration check in parseJwtPayload`
- `docs(api): document rate limiting on auth endpoints`
- `test(security): add test suite for constant time PIN verification`

---

## 4. Code Quality & Standards

### TypeScript & React
- Maintain strict type safety (`strict: true` in `tsconfig.json`).
- Avoid `any` types wherever possible; use interfaces defined in `src/types/`.
- All React components must be functional components with hooks.
- All icons must be imported from `lucide-react`.

### Zero-Plaintext Security Invariant
- Plaintext messages must **never** be sent over network APIs or persisted to backend databases.
- The cipher engine executes purely client-side in memory.
- Backend vault storage must only store `ciphertext`, `shift`, and non-sensitive operational metadata.

---

## 5. Testing Requirements

Before submitting any Pull Request:
1. **Type Checking & Linting**:
   ```bash
   npm run lint
   ```
2. **Automated Test Suite**:
   ```bash
   npm test
   ```
   Ensure all unit test suites pass with zero regressions.
3. **Android Platform Sync** (if modifying native features):
   ```bash
   npm run cap:sync
   ```

---

## 6. Pull Request Process

1. Create a descriptive PR title and fill in the PR description template.
2. Reference any related issues or phase milestones.
3. Confirm that no secrets, API keys, or personal tokens are committed.
4. Ensure the PR builds cleanly and passes all automated tests.
5. Request a review from the project maintainers.
