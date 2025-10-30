// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// FIX: Added jest-axe setup to extend expect with accessibility matchers.
// Replaced manual expect.extend with the recommended import for jest-axe,
// which handles both runtime and TypeScript types for all tests.
import 'jest-axe/extend-expect';