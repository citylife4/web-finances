import * as XLSX from 'xlsx'

const uniqueId = Date.now()
const testUser = {
  name: `Smoke User ${uniqueId}`,
  email: `smoke-${uniqueId}@example.com`,
  password: 'SmokePass123'
}

const category = {
  name: `Automation Savings ${uniqueId}`,
  updatedName: `Automation Savings Updated ${uniqueId}`
}

const account = {
  name: `Automation Account ${uniqueId}`,
  updatedName: `Automation Account Updated ${uniqueId}`
}

const importWorkbookPath = 'cypress/screenshots/smoke-import.xlsx'
const importedAccount = `Imported Wallet ${uniqueId}`
const importedCategory = `Imported Category ${uniqueId}`

const selectOptionByText = (selector, text) => {
  return cy.get(selector).should(($select) => {
    expect($select[0].options.length).to.be.greaterThan(1)
  }).then(($select) => {
    const match = [...$select[0].options].find((option) => option.text.includes(text))
    expect(match, `option containing ${text}`).to.exist
    return cy.wrap($select).select(match.value)
  })
}

const buildImportWorkbook = () => {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Bank/Wallet', 'Type', 'Category', 'Jan/2024', 'Feb/2024'],
    [importedAccount, 'deposits', importedCategory, 100, 120]
  ])
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import')

  const array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return Cypress.Buffer.from(array)
}

describe('Application smoke flow', () => {
  it('covers auth, categories, accounts, monthly entries, and import', () => {
    let accessToken
    let depositsTypeId
    let createdCategoryId

    cy.request('POST', 'http://localhost:3001/api/auth/register', testUser)
      .its('status')
      .should('eq', 201)

    cy.visit('/login')
    cy.intercept('POST', '**/api/auth/login').as('login')
    cy.intercept('POST', '**/api/auth/logout').as('logout')

    cy.get('#email').type(testUser.email)
    cy.get('#password').type(testUser.password)
    cy.contains('button', 'Login').click()
    cy.wait('@login').its('response.statusCode').should('eq', 200)
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`)

    cy.contains('button', 'Logout').click()
    cy.wait('@logout').its('response.statusCode').should('eq', 200)
    cy.url().should('include', '/login')

    cy.intercept('POST', '**/api/auth/login').as('loginAgain')
    cy.get('#email').type(testUser.email)
    cy.get('#password').type(testUser.password)
    cy.contains('button', 'Login').click()
    cy.wait('@loginAgain').its('response.statusCode').should('eq', 200)
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`)

    cy.window().then((win) => {
      accessToken = win.localStorage.getItem('accessToken')
      expect(accessToken, 'access token after login').to.be.a('string').and.not.be.empty

      return cy.request({
        method: 'GET',
        url: 'http://localhost:3001/api/category-types',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    }).then(({ body }) => {
      const depositsType = body.find((type) => type.name === 'deposits')
      expect(depositsType, 'deposits system type').to.exist
      depositsTypeId = depositsType._id

      return cy.request({
        method: 'POST',
        url: 'http://localhost:3001/api/categories',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          name: category.name,
          typeId: depositsTypeId,
          description: 'Smoke test category'
        }
      })
    }).then(({ body }) => {
      createdCategoryId = body._id
    })

    cy.visit('/categories')
    cy.get('.loading-state').should('not.exist')
    cy.contains('h4', category.name).should('be.visible')

    cy.intercept('PUT', '**/api/categories/*').as('updateCategory')
    cy.contains('.category-card h4', category.name)
      .parents('.category-card')
      .first()
      .contains('button', 'Edit')
      .click()
    cy.get('.category-card .edit-form').should('be.visible').within(() => {
      cy.get('input[type=text]').first().clear().type(category.updatedName)
      cy.contains('button', 'Save').click()
    })
    cy.wait('@updateCategory').its('response.statusCode').should('eq', 200)
    cy.reload()
    cy.contains('h4', category.updatedName).should('be.visible')

    cy.then(() => {
      return cy.request({
        method: 'POST',
        url: 'http://localhost:3001/api/accounts',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          name: account.name,
          typeId: depositsTypeId,
          categoryId: createdCategoryId,
          description: 'Smoke test account'
        }
      })
    })

    cy.visit('/accounts')
    cy.get('.loading-state').should('not.exist')
    cy.contains('h5', account.name).should('be.visible')

    cy.intercept('PUT', '**/api/accounts/*').as('updateAccount')
    cy.contains('h5', account.name).closest('.account-card').within(() => {
      cy.get('.btn-icon').first().click()
    })
    cy.get('#editAccountName').clear().type(account.updatedName)
    cy.contains('.modal', 'Edit Account').within(() => {
      cy.contains('button', 'Update Account').click()
    })
    cy.wait('@updateAccount').its('response.statusCode').should('eq', 200)
    cy.reload()
    cy.contains('h5', account.updatedName).should('be.visible')

    cy.visit('/entry')
    cy.intercept('POST', '**/api/entries').as('saveEntries')
    cy.contains('.account-entry', account.updatedName).within(() => {
      cy.get('input[type=number]').type('{selectall}-50')
    })
    cy.contains('button', 'Save Entries').click()
    cy.wait('@saveEntries').its('response.statusCode').should('be.oneOf', [200, 201])
    cy.contains('Entries saved successfully!').should('be.visible')

    cy.visit('/import')
    cy.writeFile(importWorkbookPath, buildImportWorkbook(), null)
    cy.get('input[type=file]').selectFile(importWorkbookPath, { force: true })
    cy.contains('smoke-import.xlsx').should('be.visible')
    cy.get('body', { timeout: 10000 }).should(($body) => {
      const hasImportButton = $body.find('button').toArray().some((button) => button.innerText.includes('Import Data'))
      const hasImportError = $body.find('.error-card').length > 0
      expect(hasImportButton || hasImportError, $body.text()).to.eq(true)
    })
    cy.get('body').then(($body) => {
      const importError = $body.find('.error-card').text().trim()
      if (importError) {
        throw new Error(`Import preview failed: ${importError}`)
      }
    })
    cy.contains('button', 'Import Data').should('be.visible')
    cy.intercept('POST', '**/api/entries').as('importEntries')
    cy.contains('button', 'Import Data').click()
    cy.wait('@importEntries').its('response.statusCode').should('be.oneOf', [200, 201])
    cy.contains('Import Successful').should('be.visible')

    cy.visit('/accounts')
    cy.contains('h5', importedAccount).should('be.visible')

    cy.intercept('DELETE', '**/api/accounts/*').as('deleteAccount')
    cy.contains('.account-card h5', account.updatedName)
      .parents('.account-card')
      .first()
      .find('.btn-icon.delete')
      .click()
    cy.get('[data-cy=confirm-accept]').click()
    cy.wait('@deleteAccount').its('response.statusCode').should('eq', 200)
    cy.contains('h5', account.updatedName).should('not.exist')

    cy.visit('/categories')
    cy.intercept('DELETE', '**/api/categories/*').as('deleteCategory')
    cy.contains('.category-card h4', category.updatedName)
      .parents('.category-card')
      .first()
      .contains('button', 'Delete')
      .click()
    cy.get('[data-cy=confirm-accept]').click()
    cy.wait('@deleteCategory').its('response.statusCode').should('eq', 200)
    cy.contains('h4', category.updatedName).should('not.exist')
  })
})