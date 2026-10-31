/**
 * setup.ts
 * ─────────────────────────────────────────────────────────────
 * Global test setup file.
 * Loaded before every test file via vitest.config.ts → test.setupFiles.
 */

import '@testing-library/jest-dom';

// Silence React's "not configured to support act(...)" warning
// when using async state updates in jsdom (cosmetic only — tests pass).
// See: https://github.com/testing-library/react-testing-library/issues/1051
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

