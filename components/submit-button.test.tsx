// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubmitButton } from './submit-button'

test('affiche le libellé et un data-testid', () => {
  render(<SubmitButton>Se connecter</SubmitButton>)
  const btn = screen.getByTestId('submit-button')
  expect(btn.textContent).toContain('Se connecter')
})
