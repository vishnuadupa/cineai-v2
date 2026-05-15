import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MoodSelector } from '../MoodSelector'

describe('MoodSelector', () => {
  it('renders label', () => {
    render(<MoodSelector selected="" onChange={vi.fn()} />)
    expect(screen.getByText('Your mood')).toBeInTheDocument()
  })

  it('renders all 12 mood options', () => {
    render(<MoodSelector selected="" onChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
  })

  it('renders specific mood chips', () => {
    render(<MoodSelector selected="" onChange={vi.fn()} />)
    expect(screen.getByText('hopeful')).toBeInTheDocument()
    expect(screen.getByText('melancholic')).toBeInTheDocument()
    expect(screen.getByText('nostalgic')).toBeInTheDocument()
  })

  it('calls onChange with mood when unselected chip clicked', () => {
    const onChange = vi.fn()
    render(<MoodSelector selected="" onChange={onChange} />)
    fireEvent.click(screen.getByText('hopeful'))
    expect(onChange).toHaveBeenCalledWith('hopeful')
  })

  it('calls onChange with empty string when selected chip clicked (deselect)', () => {
    const onChange = vi.fn()
    render(<MoodSelector selected="hopeful" onChange={onChange} />)
    fireEvent.click(screen.getByText('hopeful'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('applies selected styles to active mood', () => {
    render(<MoodSelector selected="melancholic" onChange={vi.fn()} />)
    const selectedBtn = screen.getByText('melancholic')
    expect(selectedBtn.className).toContain('border-cinema-accent')
  })

  it('does not apply selected styles to inactive moods', () => {
    render(<MoodSelector selected="hopeful" onChange={vi.fn()} />)
    const inactiveBtn = screen.getByText('melancholic')
    expect(inactiveBtn.className).not.toContain('border-cinema-accent')
  })

  it('calls onChange with correct mood for any chip', () => {
    const onChange = vi.fn()
    render(<MoodSelector selected="" onChange={onChange} />)
    fireEvent.click(screen.getByText('nostalgic'))
    expect(onChange).toHaveBeenCalledWith('nostalgic')
  })
})
