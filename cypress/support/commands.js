// Custom Cypress commands for Romish.gg

/**
 * Login as test user
 */
Cypress.Commands.add('login', (steamId = 'test_user_001') => {
  // Mock Steam OAuth login
  cy.intercept('GET', '/api/auth/steam', {
    statusCode: 200,
    body: {
      success: true,
      user: {
        steamId,
        name: 'TestPlayer',
        avatar: 'https://example.com/avatar.jpg',
      },
    },
  }).as('login');

  // Set auth cookie
  cy.setCookie('connect.sid', 'mock-session-token');
  
  // Visit home page
  cy.visit('/');
  cy.wait('@login');
});

/**
 * Join queue
 */
Cypress.Commands.add('joinQueue', () => {
  cy.intercept('POST', '/api/queue/join', {
    statusCode: 200,
    body: {
      success: true,
      queue: {
        players: [{ steamId: 'test_user_001', name: 'TestPlayer' }],
        status: 'waiting',
        required: 10,
      },
    },
  }).as('joinQueue');

  cy.contains('button', /join/i).click();
  cy.wait('@joinQueue');
});

/**
 * Simulate queue filling
 */
Cypress.Commands.add('simulateQueueFull', () => {
  // Mock 10 players joining
  const players = Array.from({ length: 10 }, (_, i) => ({
    steamId: `player_${i}`,
    name: `Player ${i}`,
    avatar: 'https://example.com/avatar.jpg',
  }));

  cy.intercept('GET', '/api/queue/status', {
    statusCode: 200,
    body: {
      success: true,
      queue: {
        players,
        status: 'accept_phase',
        required: 10,
      },
    },
  });
});

/**
 * Wait for accept popup
 */
Cypress.Commands.add('waitForAcceptPopup', () => {
  cy.get('.accept-match-overlay', { timeout: 10000 }).should('be.visible');
});

/**
 * Accept match
 */
Cypress.Commands.add('acceptMatch', () => {
  cy.intercept('POST', '/api/match/*/accept', {
    statusCode: 200,
    body: {
      success: true,
      acceptStatus: {
        acceptedCount: 1,
        totalRequired: 10,
      },
    },
  }).as('acceptMatch');

  cy.get('.giant-accept-btn').click();
  cy.wait('@acceptMatch');
});

/**
 * Mock Socket.IO events
 */
Cypress.Commands.add('mockSocketEvent', (event, data) => {
  cy.window().then((win) => {
    if (win.io && win.io.socket) {
      win.io.socket.emit(event, data);
    }
  });
});
