import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LensSelector } from '../LensSelector'

describe('LensSelector', () => {
  const setup = () => {
    const onContinue = jest.fn()
    const onBack = jest.fn()
    render(<LensSelector onContinue={onContinue} onBack={onBack} />)
    return { onContinue, onBack }
  }

  it('shows validation errors for outdated prescription and invalid CRM', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByText('Acuvue'))
    const [rightSphere, leftSphere] = screen.getAllByPlaceholderText('-2.00')
    await user.type(rightSphere, '-2.00')
    await user.type(leftSphere, '-2.25')

    const outdated = new Date()
    outdated.setFullYear(outdated.getFullYear() - 2)
    const outdatedValue = outdated.toISOString().split('T')[0]
    const dateInput = document.getElementById('prescription-date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: outdatedValue } })

    const crmInput = screen.getByPlaceholderText('123456-MG')
    await user.type(crmInput, '123456sp')

    expect(await screen.findByText('Prescrição deve ter menos de 1 ano')).toBeInTheDocument()
    expect(await screen.findByText('Formato inválido (ex: 123456-MG)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('enforces axis requirement when cylinder is provided', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByText('Acuvue'))
    const [rightSphere, leftSphere] = screen.getAllByPlaceholderText('-2.00')
    await user.type(rightSphere, '-2.00')
    await user.type(leftSphere, '-2.25')

    const [rightCylinder] = screen.getAllByPlaceholderText('-0.75')
    await user.type(rightCylinder, '-1.25')

    expect(await screen.findByText('Necessário quando há cilíndrico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()

    const [rightAxis] = screen.getAllByPlaceholderText('180')
    await user.type(rightAxis, '90')

    expect(screen.queryByText('Necessário quando há cilíndrico')).not.toBeInTheDocument()
  })

  it('allows advancing with valid mirrored prescription data', async () => {
    const user = userEvent.setup()
    const { onContinue } = setup()

    await user.click(screen.getByText('Diárias'))
    await user.click(screen.getByText('Acuvue'))
    await user.click(screen.getByRole('button', { name: 'Mesmo grau para ambos' }))

    const [rightSphere] = screen.getAllByPlaceholderText('-2.00')
    await user.type(rightSphere, '-2.00')

    const validDate = new Date()
    validDate.setMonth(validDate.getMonth() - 3)
    const validValue = validDate.toISOString().split('T')[0]
    const dateInput = document.getElementById('prescription-date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: validValue } })

    const crmInput = screen.getByPlaceholderText('123456-MG')
    await user.type(crmInput, '123456-SP')

    const continueButton = screen.getByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)

    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'daily',
        brand: 'Acuvue',
        rightEye: expect.objectContaining({ sphere: '-2.00' }),
        leftEye: expect.objectContaining({ sphere: '-2.00' }),
        prescriptionDate: validValue,
        doctorCRM: '123456-SP',
      }),
    )
  })
})
