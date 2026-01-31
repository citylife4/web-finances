// E2E test for authentication flow
describe('Authentication', () => {
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123'
  }

  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the home page', () => {
    cy.url().should('include', '/')
  })

  it('should allow user registration', () => {
    // Navigate to register page (update selector based on actual UI)
    cy.get('[data-cy=register-link]').click()
    
    cy.get('[data-cy=name-input]').type(testUser.name)
    cy.get('[data-cy=email-input]').type(testUser.email)
    cy.get('[data-cy=password-input]').type(testUser.password)
    cy.get('[data-cy=register-button]').click()
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard')
  })

  it('should allow user login', () => {
    // Navigate to login page
    cy.get('[data-cy=login-link]').click()
    
    cy.get('[data-cy=email-input]').type(testUser.email)
    cy.get('[data-cy=password-input]').type(testUser.password)
    cy.get('[data-cy=login-button]').click()
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard')
  })

  it('should show validation errors for invalid login', () => {
    cy.get('[data-cy=login-link]').click()
    
    cy.get('[data-cy=email-input]').type('invalid@example.com')
    cy.get('[data-cy=password-input]').type('wrongpassword')
    cy.get('[data-cy=login-button]').click()
    
    // Should show error message
    cy.get('[data-cy=error-message]').should('be.visible')
  })
})
