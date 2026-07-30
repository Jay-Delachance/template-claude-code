import { expect, test } from 'vitest'
import { MANAGER_ROLES } from './types'

test('les rôles gestionnaires sont owner et admin', () => {
  expect(MANAGER_ROLES).toEqual(['owner', 'admin'])
})
