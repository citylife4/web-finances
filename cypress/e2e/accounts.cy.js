// E2E test for account management
describe('Account Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.register('Test User', `test${Date.now()}@example.com`, 'TestPass123')
    cy.visit('/accounts')
  })

  it('should display the accounts page', () => {
    cy.url().should('include', '/accounts')
    cy.get('h1, h2').should('contain', 'Account')
  })

  it('should create a new account', () => {
    // Click add account button
    cy.get('[data-cy=add-account-button]').click()
    
    // Fill in account details
    cy.get('[data-cy=account-name]').type('Test Savings Account')
    cy.get('[data-cy=account-type]').select('deposits')
    cy.get('[data-cy=account-category]').select(1) // Select first category
    cy.get('[data-cy=save-account]').click()
    
    // Verify account was created
    cy.contains('Test Savings Account').should('be.visible')
  })

  it('should edit an existing account', () => {
    // First create an account
    cy.get('[data-cy=add-account-button]').click()
    cy.get('[data-cy=account-name]').type('Account To Edit')
    cy.get('[data-cy=account-type]').select('deposits')
    cy.get('[data-cy=account-category]').select(1)
    cy.get('[data-cy=save-account]').click()
    
    // Edit the account
    cy.contains('Account To Edit')
      .parent()
      .find('[data-cy=edit-button]')
      .click()
    
    cy.get('[data-cy=account-name]').clear().type('Edited Account Name')
    cy.get('[data-cy=save-account]').click()
    
    // Verify changes
    cy.contains('Edited Account Name').should('be.visible')
  })

  it('should delete an account', () => {
    // First create an account
    cy.get('[data-cy=add-account-button]').click()
    cy.get('[data-cy=account-name]').type('Account To Delete')
    cy.get('[data-cy=account-type]').select('investments')
    cy.get('[data-cy=account-category]').select(1)
    cy.get('[data-cy=save-account]').click()
    
    // Delete the account
    cy.contains('Account To Delete')
      .parent()
      .find('[data-cy=delete-button]')
      .click()
    
    // Confirm deletion
    cy.get('[data-cy=confirm-delete]').click()
    
    // Verify account was deleted
    cy.contains('Account To Delete').should('not.exist')
  })
})
