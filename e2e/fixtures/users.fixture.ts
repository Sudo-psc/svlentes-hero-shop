/**
 * Test User Fixtures
 * Pre-defined test users for E2E testing
 */

export interface TestUserFixture {
  id: string
  email: string
  password: string
  firebaseUid: string
  name: string
  phone: string
  cpf: string
  createdAt: Date
}

/**
 * Test User A - Has active subscription
 */
export const TEST_USER_A: TestUserFixture = {
  id: 'test_user_a_001',
  email: 'usuario.a@test.svlentes.shop',
  password: 'TestUser123!@#',
  firebaseUid: 'firebase_test_user_a_001',
  name: 'Usuário A de Teste',
  phone: '33999999001',
  cpf: '12345678909', // Valid CPF
  createdAt: new Date('2024-01-01T00:00:00Z')
}

/**
 * Test User B - Has active subscription
 */
export const TEST_USER_B: TestUserFixture = {
  id: 'test_user_b_002',
  email: 'usuario.b@test.svlentes.shop',
  password: 'TestUser123!@#',
  firebaseUid: 'firebase_test_user_b_002',
  name: 'Usuário B de Teste',
  phone: '33999999002',
  cpf: '98765432100', // Valid CPF
  createdAt: new Date('2024-01-15T00:00:00Z')
}

/**
 * Test User C - No subscription (for registration tests)
 */
export const TEST_USER_C: TestUserFixture = {
  id: 'test_user_c_003',
  email: 'usuario.c@test.svlentes.shop',
  password: 'TestUser123!@#',
  firebaseUid: 'firebase_test_user_c_003',
  name: 'Usuário C de Teste',
  phone: '33999999003',
  cpf: '11122233344', // Valid CPF
  createdAt: new Date('2024-02-01T00:00:00Z')
}

/**
 * Test Admin User
 */
export const TEST_ADMIN: TestUserFixture = {
  id: 'test_admin_999',
  email: 'admin@test.svlentes.shop',
  password: 'AdminTest123!@#',
  firebaseUid: 'firebase_test_admin_999',
  name: 'Administrador de Teste',
  phone: '33999999999',
  cpf: '00011122233', // Valid CPF
  createdAt: new Date('2024-01-01T00:00:00Z')
}

/**
 * All test users
 */
export const ALL_TEST_USERS = [
  TEST_USER_A,
  TEST_USER_B,
  TEST_USER_C,
  TEST_ADMIN
]
