import { render, screen, fireEvent } from '@testing-library/react';
import PhraseCard from '../PhraseCard';
import { Phrase } from '@/lib/types/phrases';

const mockPhrase: Phrase = {
  id: 1,
  user_id: 1,
  source_language_id: 1,
  target_language_id: 2,
  original_text: 'Hello',
  translated_text: 'Hola',
  pronunciation: '/həˈloʊ/',
  last_reviewed_date: new Date('2024-01-01').toISOString(),
  next_review_date: null,
  created_at: new Date('2024-01-01').toISOString(),
  active: true,
  source_language: { id: 1, name: 'English' },
  target_language: { id: 2, name: 'Spanish' }
};

describe('PhraseCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders phrase text correctly', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders translated text on back of card', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
  });

  it('displays pronunciation when available', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('[/həˈloʊ/]')).toBeInTheDocument();
  });

  it('does not display pronunciation when null', () => {
    const phraseWithoutPronunciation = { ...mockPhrase, pronunciation: null };
    render(<PhraseCard phrase={phraseWithoutPronunciation} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByText(/\[.*\]/)).not.toBeInTheDocument();
  });

  it('flips card when clicked', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const frontCard = screen.getByText('Hello').closest('.cursor-pointer');
    fireEvent.click(frontCard!);
    
    // After flip, the translation should be visible
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('flips back when clicked again', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const frontCard = screen.getByText('Hello').closest('.cursor-pointer');
    
    // First click - flip to show translation
    fireEvent.click(frontCard!);
    expect(screen.getByText('Hola')).toBeInTheDocument();
    
    // Second click - flip back to show original
    const backCard = screen.getByText('Hola').closest('.cursor-pointer');
    fireEvent.click(backCard!);
    
    // Original text should still be visible (both sides are in DOM)
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const editButton = screen.getByLabelText('Editar frase');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockPhrase);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByLabelText('Eliminar frase');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(1);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('prevents card flip when clicking edit button', () => {
    const { container } = render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const innerCard = container.querySelector('.transform-3d');
    const editButton = screen.getByLabelText('Editar frase');
    
    fireEvent.click(editButton);
    
    expect(innerCard).not.toHaveClass('transform-[rotateY(180deg)]');
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('prevents card flip when clicking delete button', () => {
    const { container } = render(<PhraseCard phrase={mockPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const innerCard = container.querySelector('.transform-3d');
    const deleteButton = screen.getByLabelText('Eliminar frase');
    
    fireEvent.click(deleteButton);
    
    expect(innerCard).not.toHaveClass('transform-[rotateY(180deg)]');
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('shows battery warning icon for phrases never reviewed', () => {
    const unreviewedPhrase = { ...mockPhrase, last_reviewed_date: null };
    const { container } = render(<PhraseCard phrase={unreviewedPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const batteryIcon = container.querySelector('.text-parla-red.animate-pulse');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery full icon for recently reviewed phrases (within 7 days)', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3);
    const recentPhrase = { ...mockPhrase, last_reviewed_date: recentDate.toISOString() };
    
    const { container } = render(<PhraseCard phrase={recentPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const batteryIcon = container.querySelector('.text-green-500');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery medium icon for phrases reviewed 8-14 days ago', () => {
    const mediumDate = new Date();
    mediumDate.setDate(mediumDate.getDate() - 10);
    const mediumPhrase = { ...mockPhrase, last_reviewed_date: mediumDate.toISOString() };
    
    const { container } = render(<PhraseCard phrase={mediumPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const batteryIcon = container.querySelector('.text-\\[\\#F5A623\\]');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery warning icon for phrases reviewed more than 14 days ago', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 20);
    const oldPhrase = { ...mockPhrase, last_reviewed_date: oldDate.toISOString() };
    
    const { container } = render(<PhraseCard phrase={oldPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const batteryIcon = container.querySelector('.text-parla-red.animate-pulse');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('handles long text with word breaks', () => {
    const longPhrase = {
      ...mockPhrase,
      original_text: 'Supercalifragilisticexpialidocious',
      translated_text: 'Supercalifragilisticoespialidoso'
    };
    
    render(<PhraseCard phrase={longPhrase} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Supercalifragilisticexpialidocious')).toBeInTheDocument();
    expect(screen.getByText('Supercalifragilisticoespialidoso')).toBeInTheDocument();
  });
});
