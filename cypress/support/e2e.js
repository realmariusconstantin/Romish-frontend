// Import commands
import './commands';

// Disable uncaught exception handling (useful for dev)
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false;
});

// Add custom assertions
beforeEach(() => {
  // Clear localStorage and cookies before each test
  cy.clearLocalStorage();
  cy.clearCookies();
});
