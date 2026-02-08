// Cypress E2E support file
// Add custom commands and global configuration here

// Prevent TypeScript errors in spec files
/// <reference types="cypress" />

// Custom command to login
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', 'http://localhost:3001/api/auth/login', {
    email,
    password
  }).then((response) => {
    window.localStorage.setItem('accessToken', response.body.accessToken)
  })
})

// Custom command to register
Cypress.Commands.add('register', (name, email, password) => {
  cy.request('POST', 'http://localhost:3001/api/auth/register', {
    name,
    email,
    password
  }).then((response) => {
    window.localStorage.setItem('accessToken', response.body.accessToken)
  })
})

// Preserve access token between tests
beforeEach(() => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken')
    if (token) {
      cy.wrap(token).as('accessToken')
    }
  })
})
