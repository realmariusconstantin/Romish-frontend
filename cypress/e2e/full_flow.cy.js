describe('Full Matchmaking Flow', () => {
  beforeEach(() => {
    // Clear all cookies and local storage
    cy.clearCookies();
    cy.clearLocalStorage();

    // Mock successful authentication
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          steamId: 'test_user_001',
          name: 'TestPlayer',
          avatar: 'https://example.com/avatar.jpg',
          profileUrl: 'https://steamcommunity.com/id/test',
          isAdmin: false,
        },
      },
    }).as('getUser');

    // Mock initial queue status
    cy.intercept('GET', '/api/queue/status', {
      statusCode: 200,
      body: {
        success: true,
        queue: {
          players: [],
          status: 'waiting',
          required: 10,
        },
      },
    }).as('getQueueStatus');
  });

  it('should complete login → queue → accept → draft flow', () => {
    // Step 1: Visit homepage and verify login persistence
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');
    cy.wait('@getQueueStatus');

    // Verify user is logged in (no logout on reload)
    cy.contains('TestPlayer').should('be.visible');
    cy.contains('Join Queue').should('be.visible');

    // Step 2: Join queue and verify live counter updates
    cy.intercept('POST', '/api/queue/join', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Joined queue successfully',
        queue: {
          players: [{
            steamId: 'test_user_001',
            name: 'TestPlayer',
            avatar: 'https://example.com/avatar.jpg',
          }],
          status: 'waiting',
          required: 10,
        },
      },
    }).as('joinQueue');

    cy.contains('Join Queue').click();
    cy.wait('@joinQueue');

    // Verify queue counter shows 1/10
    cy.contains('1 / 10').should('be.visible');

    // Step 3: Simulate 9 more players joining (mock WebSocket events)
    cy.window().then((win) => {
      // Mock socket events for players joining
      const mockPlayers = [];
      for (let i = 2; i <= 10; i++) {
        mockPlayers.push({
          steamId: `test_user_${i.toString().padStart(3, '0')}`,
          name: `TestPlayer${i}`,
          avatar: 'https://example.com/avatar.jpg',
        });
      }

      // Simulate queue filling up
      win.dispatchEvent(new CustomEvent('queue:player-joined', {
        detail: { player: mockPlayers[0] }
      }));

      // Update queue status
      win.dispatchEvent(new CustomEvent('queue:updated', {
        detail: {
          players: [{
            steamId: 'test_user_001',
            name: 'TestPlayer',
            avatar: 'https://example.com/avatar.jpg',
          }, ...mockPlayers],
          status: 'waiting',
        }
      }));
    });

    // Verify counter updates to 10/10
    cy.contains('10 / 10').should('be.visible');

    // Step 4: Mock queue full → match-ready event
    cy.intercept('POST', '/api/queue/join', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Queue full - match created!',
        matchId: 'PEND-test-match-123',
        redirectTo: '/draft/PEND-test-match-123',
        queue: {
          players: [],
          status: 'completed',
          required: 10,
        },
      },
    }).as('queueFull');

    // Simulate match-ready event
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('match-ready', {
        detail: {
          matchId: 'PEND-test-match-123',
          expiresAt: new Date(Date.now() + 20000),
          timeout: 20000,
          requiredPlayers: Array(10).fill(null).map((_, i) => ({
            steamId: `test_user_${(i + 1).toString().padStart(3, '0')}`,
          })),
          message: 'Match found! Click ACCEPT to continue.',
        }
      }));
    });

    // Step 5: Verify accept modal appears
    cy.contains('Match found! Click ACCEPT').should('be.visible');
    cy.contains('ACCEPT').should('be.visible');

    // Step 6: Mock all players accepting
    cy.intercept('POST', '/api/match/ready/accept', {
      statusCode: 200,
      body: { success: true },
    }).as('acceptMatch');

    // Simulate other players accepting
    cy.window().then((win) => {
      for (let i = 2; i <= 10; i++) {
        win.dispatchEvent(new CustomEvent('player-accepted', {
          detail: {
            steamId: `test_user_${i.toString().padStart(3, '0')}`,
            name: `TestPlayer${i}`,
          }
        }));
      }
    });

    // Click accept
    cy.contains('ACCEPT').click();
    cy.wait('@acceptMatch');

    // Step 7: Mock match-starting event
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('match-starting', {
        detail: {
          matchId: 'REAL-test-match-123',
          phase: 'draft',
          message: 'Match starting',
        }
      }));
    });

    // Step 8: Verify redirect to draft phase
    cy.url().should('include', '/draft/REAL-test-match-123');

    // Verify draft interface appears
    cy.contains('Captain Draft').should('be.visible');
    cy.contains('Pick your team').should('be.visible');
  });

  it('should handle queue leave functionality', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    // Join queue first
    cy.intercept('POST', '/api/queue/join', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Joined queue successfully',
        queue: {
          players: [{
            steamId: 'test_user_001',
            name: 'TestPlayer',
            avatar: 'https://example.com/avatar.jpg',
          }],
          status: 'waiting',
          required: 10,
        },
      },
    }).as('joinQueue');

    cy.contains('Join Queue').click();
    cy.wait('@joinQueue');

    // Verify in queue
    cy.contains('Leave Queue').should('be.visible');

    // Leave queue
    cy.intercept('POST', '/api/queue/leave', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Left queue successfully',
        queue: {
          players: [],
          count: 0,
          required: 10,
        },
      },
    }).as('leaveQueue');

    cy.contains('Leave Queue').click();
    cy.wait('@leaveQueue');

    // Verify left queue
    cy.contains('Join Queue').should('be.visible');
    cy.contains('0 / 10').should('be.visible');
  });

  it('should persist login across page reloads', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    // Verify logged in
    cy.contains('TestPlayer').should('be.visible');

    // Reload page
    cy.reload();
    cy.wait('@getUser');

    // Should still be logged in (no logout)
    cy.contains('TestPlayer').should('be.visible');
    cy.contains('Join Queue').should('be.visible');

    // Should not see login required message
    cy.contains('Please log in').should('not.exist');
  });

  it('should handle accept phase timeout', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    // Join and fill queue quickly
    cy.contains('Join Queue').click();

    // Simulate match ready
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('match-ready', {
        detail: {
          matchId: 'PEND-timeout-test',
          expiresAt: new Date(Date.now() + 5000), // 5 seconds
          timeout: 5000,
          requiredPlayers: Array(10).fill(null).map((_, i) => ({
            steamId: `test_user_${(i + 1).toString().padStart(3, '0')}`,
          })),
        }
      }));
    });

    // Accept modal should appear
    cy.contains('ACCEPT').should('be.visible');

    // Wait for timeout
    cy.wait(6000);

    // Should show timeout message and return to queue
    cy.contains('Match timed out').should('be.visible');
    cy.contains('Join Queue').should('be.visible');
  });
});