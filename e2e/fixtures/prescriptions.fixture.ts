/**
 * Test Prescription Fixtures
 * Pre-defined prescriptions for E2E testing
 */

import { TEST_USER_A, TEST_USER_B } from './users.fixture.js'
import { SUBSCRIPTION_A, SUBSCRIPTION_B } from './subscriptions.fixture.js'

export interface TestPrescriptionFixture {
  id: string
  userId: string
  subscriptionId: string
  fileName: string
  fileUrl: string
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png'
  fileSize: number
  doctorName: string
  doctorCRM: string
  issueDate: Date
  expiryDate: Date
  rightEye: {
    sphere: number
    cylinder: number
    axis: number
    addition: number
  }
  leftEye: {
    sphere: number
    cylinder: number
    axis: number
    addition: number
  }
  status: 'ACTIVE' | 'EXPIRED' | 'REPLACED'
}

/**
 * User A's Current Prescription (PDF)
 */
export const PRESCRIPTION_A1: TestPrescriptionFixture = {
  id: 'test_prescription_a1',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  fileName: 'prescricao_usuario_a_2024.pdf',
  fileUrl: '/test-uploads/prescricao_usuario_a_2024.pdf',
  fileType: 'application/pdf',
  fileSize: 250 * 1024, // 250KB
  doctorName: 'Dr. Philipe Saraiva Cruz',
  doctorCRM: 'CRM-MG 69.870',
  issueDate: new Date('2024-01-01T00:00:00Z'),
  expiryDate: new Date('2025-01-01T00:00:00Z'),
  rightEye: {
    sphere: -2.50,
    cylinder: -0.75,
    axis: 180,
    addition: 0
  },
  leftEye: {
    sphere: -2.25,
    cylinder: -0.50,
    axis: 175,
    addition: 0
  },
  status: 'ACTIVE'
}

/**
 * User A's Old Prescription (Replaced)
 */
export const PRESCRIPTION_A2: TestPrescriptionFixture = {
  id: 'test_prescription_a2',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  fileName: 'prescricao_usuario_a_2023.pdf',
  fileUrl: '/test-uploads/prescricao_usuario_a_2023.pdf',
  fileType: 'application/pdf',
  fileSize: 180 * 1024, // 180KB
  doctorName: 'Dr. Philipe Saraiva Cruz',
  doctorCRM: 'CRM-MG 69.870',
  issueDate: new Date('2023-01-01T00:00:00Z'),
  expiryDate: new Date('2024-01-01T00:00:00Z'),
  rightEye: {
    sphere: -2.00,
    cylinder: -0.50,
    axis: 180,
    addition: 0
  },
  leftEye: {
    sphere: -1.75,
    cylinder: -0.25,
    axis: 175,
    addition: 0
  },
  status: 'REPLACED'
}

/**
 * User B's Current Prescription (JPEG Image)
 */
export const PRESCRIPTION_B1: TestPrescriptionFixture = {
  id: 'test_prescription_b1',
  userId: TEST_USER_B.id,
  subscriptionId: SUBSCRIPTION_B.id,
  fileName: 'prescricao_usuario_b_2024.jpg',
  fileUrl: '/test-uploads/prescricao_usuario_b_2024.jpg',
  fileType: 'image/jpeg',
  fileSize: 450 * 1024, // 450KB
  doctorName: 'Dr. Philipe Saraiva Cruz',
  doctorCRM: 'CRM-MG 69.870',
  issueDate: new Date('2024-01-15T00:00:00Z'),
  expiryDate: new Date('2025-01-15T00:00:00Z'),
  rightEye: {
    sphere: -3.00,
    cylinder: -1.00,
    axis: 90,
    addition: 0
  },
  leftEye: {
    sphere: -2.75,
    cylinder: -0.75,
    axis: 85,
    addition: 0
  },
  status: 'ACTIVE'
}

/**
 * All test prescriptions
 */
export const ALL_TEST_PRESCRIPTIONS = [
  PRESCRIPTION_A1,
  PRESCRIPTION_A2,
  PRESCRIPTION_B1
]
