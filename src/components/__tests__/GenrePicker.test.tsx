import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenrePicker } from '../GenrePicker'

describe('GenrePicker', () => {
  it('renders label', () => {
    render(<GenrePicker selected={[]} onChange={vi.fn()} />)
    expect(screen.getByText('Genres')).toBeInTheDocument()
  })

  it('renders all 12 genre options', () => {
    render(<GenrePicker selected={[]} onChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
  })

  it('renders specific genres', () => {
    render(<GenrePicker selected={[]} onChange={vi.fn()} />)
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument()
    expect(screen.getByText('Horror')).toBeInTheDocument()
  })

  it('calls onChange with genre when clicked', () => {
    const onChange = vi.fn()
    render(<GenrePicker selected={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('Drama'))
    expect(onChange).toHaveBeenCalledWith('Drama')
  })

  it('applies selected styles when genre is in selected array', () => {
    render(<GenrePicker selected={['Sci-Fi']} onChange={vi.fn()} />)
    const selectedBtn = screen.getByText('Sci-Fi')
    expect(selectedBtn.className).toContain('border-cinema-accent')
  })

  it('does not apply selected styles to unselected genres', () => {
    render(<GenrePicker selected={['Drama']} onChange={vi.fn()} />)
    const unselected = screen.getByText('Horror')
    expect(unselected.className).not.toContain('border-cinema-accent')
  })

  it('supports multiple selected genres simultaneously', () => {
    render(<GenrePicker selected={['Drama', 'Sci-Fi', 'Horror']} onChange={vi.fn()} />)
    expect(screen.getByText('Drama').className).toContain('border-cinema-accent')
    expect(screen.getByText('Sci-Fi').className).toContain('border-cinema-accent')
    expect(screen.getByText('Horror').className).toContain('border-cinema-accent')
    expect(screen.getByText('Comedy').className).not.toContain('border-cinema-accent')
  })

  it('calls onChange when already-selected genre clicked (parent handles deselect)', () => {
    const onChange = vi.fn()
    render(<GenrePicker selected={['Drama']} onChange={onChange} />)
    fireEvent.click(screen.getByText('Drama'))
    expect(onChange).toHaveBeenCalledWith('Drama')
  })
})
