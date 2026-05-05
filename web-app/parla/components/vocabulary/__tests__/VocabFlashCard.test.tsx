import { render, screen, fireEvent } from '@testing-library/react';
import VocabFlashCard from '../VocabFlashCard';

const mockWordItem = {
  id: 1,
  word: 'Hello',
  translation: 'Hola',
  strength: 4,
  type: 'Greeting'
};

describe('VocabFlashCard', () => {
  it('renders word correctly', () => {
    render(<VocabFlashCard item={mockWordItem} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Greeting')).toBeInTheDocument();
  });

  it('renders translation on back of card', () => {
    render(<VocabFlashCard item={mockWordItem} />);
    
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('displays strength level', () => {
    render(<VocabFlashCard item={mockWordItem} />);
    
    expect(screen.getByText('Fuerza actual: 4/5')).toBeInTheDocument();
  });

  it('flips card when clicked', () => {
    const { container } = render(<VocabFlashCard item={mockWordItem} />);
    
    const cardContainer = container.querySelector('.perspective-1000px');
    const innerCard = cardContainer?.querySelector('.transform-3d');
    
    expect(innerCard).not.toHaveClass('transform-[rotateY(180deg)]');
    
    fireEvent.click(cardContainer!);
    
    expect(innerCard).toHaveClass('transform-[rotateY(180deg)]');
  });

  it('flips back when clicked again', () => {
    const { container } = render(<VocabFlashCard item={mockWordItem} />);
    
    const cardContainer = container.querySelector('.perspective-1000px');
    const innerCard = cardContainer?.querySelector('.transform-3d');
    
    fireEvent.click(cardContainer!);
    expect(innerCard).toHaveClass('transform-[rotateY(180deg)]');
    
    fireEvent.click(cardContainer!);
    expect(innerCard).not.toHaveClass('transform-[rotateY(180deg)]');
  });

  it('shows battery full icon for high strength (4-5)', () => {
    const { container } = render(<VocabFlashCard item={mockWordItem} />);
    
    const batteryIcon = container.querySelector('.text-green-500');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery medium icon for medium strength (3)', () => {
    const mediumStrengthItem = { ...mockWordItem, strength: 3 };
    const { container } = render(<VocabFlashCard item={mediumStrengthItem} />);
    
    const batteryIcon = container.querySelector('.text-\\[\\#F5A623\\]');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery warning icon for low strength (0-2)', () => {
    const lowStrengthItem = { ...mockWordItem, strength: 2 };
    const { container } = render(<VocabFlashCard item={lowStrengthItem} />);
    
    const batteryIcon = container.querySelector('.text-parla-red.animate-pulse');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery warning icon for strength 0', () => {
    const zeroStrengthItem = { ...mockWordItem, strength: 0 };
    const { container } = render(<VocabFlashCard item={zeroStrengthItem} />);
    
    const batteryIcon = container.querySelector('.text-parla-red.animate-pulse');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery warning icon for strength 1', () => {
    const lowStrengthItem = { ...mockWordItem, strength: 1 };
    const { container } = render(<VocabFlashCard item={lowStrengthItem} />);
    
    const batteryIcon = container.querySelector('.text-parla-red.animate-pulse');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('shows battery full icon for strength 5', () => {
    const maxStrengthItem = { ...mockWordItem, strength: 5 };
    const { container } = render(<VocabFlashCard item={maxStrengthItem} />);
    
    const batteryIcon = container.querySelector('.text-green-500');
    expect(batteryIcon).toBeInTheDocument();
  });

  it('has cursor pointer class', () => {
    const { container } = render(<VocabFlashCard item={mockWordItem} />);
    
    const cardContainer = container.querySelector('.cursor-pointer');
    expect(cardContainer).toBeInTheDocument();
  });

  it('displays type in uppercase', () => {
    render(<VocabFlashCard item={mockWordItem} />);
    
    const typeElement = screen.getByText('Greeting');
    expect(typeElement).toHaveClass('uppercase');
  });

  it('renders different word items correctly', () => {
    const differentItem = {
      id: 2,
      word: 'Goodbye',
      translation: 'Adiós',
      strength: 3,
      type: 'Farewell'
    };
    
    render(<VocabFlashCard item={differentItem} />);
    
    expect(screen.getByText('Goodbye')).toBeInTheDocument();
    expect(screen.getByText('Adiós')).toBeInTheDocument();
    expect(screen.getByText('Farewell')).toBeInTheDocument();
    expect(screen.getByText('Fuerza actual: 3/5')).toBeInTheDocument();
  });
});
