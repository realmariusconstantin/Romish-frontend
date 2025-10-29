describe('Accept Phase Flow', () => {
  beforeEach(() => {
    // Mock backend API
    cy.intercept('GET', '/api/auth/user', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          steamId: 'test_user_001',
          name: 'TestPlayer',
          avatar: 'https://example.com/avatar.jpg',
          profileUrl: 'https://steamcommunity.com/id/test',
        },
      },
    }).as('getUser');

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

  it('should complete full accept phase flow', () => {
    // Step 1: Visit homepage
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');
    cy.wait('@getQueueStatus');

    // Step 2: Verify initial state
    cy.contains('Join Queue').should('be.visible');
    
    // Step 3: Click Join Queue
    cy.intercept('POST', '/api/queue/join', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Joined queue successfully',
        queue: {
          players: [
            {
              steamId: 'test_user_001',
              name: 'TestPlayer',
              avatar: 'https://example.com/avatar.jpg',
              joinedAt: new Date().toISOString(),
            },
          ],
          status: 'waiting',
          required: 10,
        },
      },
    }).as('joinQueue');

    cy.contains('button', /join/i).click();
    cy.wait('@joinQueue');

    // Step 4: Verify in queue
    cy.contains(/leave/i).should('be.visible');

    // Step 5: Simulate queue filling to 10 players
    const players = Array.from({ length: 10 }, (_, i) => ({
      steamId: `player_${i}`,
      name: `Player ${i}`,
      avatar: 'https://example.com/avatar.jpg',
      joinedAt: new Date().toISOString(),
    }));

    cy.intercept('GET', '/api/queue/status', {
      statusCode: 200,
      body: {
        success: true,
        queue: {
          players,
          status: 'full',
          required: 10,
        },
      },
    });

    // Step 6: Wait for match-ready event and accept popup
    cy.get('.accept-match-overlay', { timeout: 15000 }).should('be.visible');
    
    // Step 7: Verify timer is displayed
    cy.get('.timer-text-large').should('be.visible');
    cy.get('.timer-text-large').should('contain', /\d+/);

    // Step 8: Click Accept button
    cy.intercept('POST', '/api/match/*/accept', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          acceptStatus: {
            matchId: 'test_match_001',
            acceptedCount: 1,
            totalRequired: 10,
          },
        },
      },
    }).as('acceptMatch');

    cy.get('.giant-accept-btn').should('be.visible');
    cy.get('.giant-accept-btn').should('contain', 'ACCEPT');
    cy.get('.giant-accept-btn').click();
    cy.wait('@acceptMatch');

    // Step 9: Verify boxes appear after accepting
    cy.get('.boxes-grid', { timeout: 5000 }).should('be.visible');
    cy.get('.box-square').should('have.length', 10);

    // Step 10: Verify "Waiting for other players" UI
    cy.get('.boxes-grid').should('be.visible');
    
    // Step 11: Simulate other players accepting
    // Boxes should turn green as more players accept
    cy.get('.box-square').first().should('exist');
  });

  it('should handle accept timeout', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    // Join queue and trigger accept phase
    cy.joinQueue();
    cy.simulateQueueFull();

    // Wait for accept popup
    cy.waitForAcceptPopup();

    // Click accept
    cy.acceptMatch();

    // Simulate timeout event
    cy.intercept('POST', '/api/match/*/accept', {
      statusCode: 400,
      body: {
        success: false,
        error: 'Accept phase has expired',
      },
    });

    // Verify timeout handling
    cy.get('.accept-match-overlay', { timeout: 65000 }).should('not.exist');
  });

  it('should redirect to draft after all players accept', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    // Mock match starting
    cy.intercept('GET', '/api/match/test_match_001', {
      statusCode: 200,
      body: {
        success: true,
        match: {
          matchId: 'test_match_001',
          phase: 'draft',
          players: [],
          captains: {
            alpha: 'player_0',
            beta: 'player_1',
          },
        },
      },
    });

    // Simulate all players accepting
    cy.window().then((win) => {
      // Trigger match-starting event
      if (win.matchStore) {
        win.matchStore.acceptPhase.active = false;
        win.matchStore.acceptPhase.matchId = 'test_match_001';
      }
    });

    // Should redirect to draft page
    cy.url({ timeout: 3000 }).should('include', '/draft/test_match_001');
  });

  it('should not allow accepting twice', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    cy.joinQueue();
    cy.simulateQueueFull();
    cy.waitForAcceptPopup();

    // Click accept once
    cy.get('.giant-accept-btn').click();

    // Button should be disabled
    cy.get('.giant-accept-btn').should('be.disabled');
  });

  it('should play sound when accept popup appears', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    // Spy on Audio constructor
    cy.window().then((win) => {
      cy.spy(win, 'Audio').as('audioConstructor');
    });

    cy.joinQueue();
    cy.simulateQueueFull();
    cy.waitForAcceptPopup();

    // Verify Audio was created
    cy.get('@audioConstructor').should('have.been.called');
  });

  it('should show real-time accept progress', () => {
    cy.visit('http://localhost:5173');
    cy.wait('@getUser');

    cy.joinQueue();
    cy.simulateQueueFull();
    cy.waitForAcceptPopup();
    cy.acceptMatch();

    // Simulate player-accepted events
    cy.window().then((win) => {
      if (win.matchStore) {
        // Add accepted players
        win.matchStore.acceptPhase.acceptedPlayers = [
          'player_0',
          'player_1',
          'player_2',
        ];
      }
    });

    // Check that boxes update
    cy.get('.box-accepted').should('have.length.at.least', 1);
  });
});
