'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/components/games/useTranslation";

// Mock data
const wordPairs = [
    { id: 1, term: 'Apple', definition: 'Manzana' },
    { id: 2, term: 'House', definition: 'Casa' },
    { id: 3, term: 'Water', definition: 'Agua' },
    { id: 4, term: 'Book', definition: 'Libro' },
];

type CardItem = {
    id: string; // unique string for the card
    pairId: number;
    text: string;
    type: 'term' | 'definition';
    isMatched: boolean;
};

const generateShuffledCards = () => {
    const newCards: CardItem[] = wordPairs.flatMap(pair => [
        { id: `term-${pair.id}`, pairId: pair.id, text: pair.term, type: 'term' as const, isMatched: false },
        { id: `def-${pair.id}`, pairId: pair.id, text: pair.definition, type: 'definition' as const, isMatched: false }
    ]);

    // Shuffle
    for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    return newCards;
};

export default function WordMatchGame() {
    const { t } = useTranslation();
    const [cards, setCards] = useState<CardItem[]>(generateShuffledCards);
    const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
    const [matches, setMatches] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);

    const initializeGame = useCallback(() => {
        setCards(generateShuffledCards());
        setSelectedCards([]);
        setMatches(0);
        setMoves(0);
        setIsGameOver(false);
    }, []);

    // No useEffect needed for initial setup anymore as generateShuffledCards handles it on useState(initializer)


    const handleCardClick = (card: CardItem) => {
        // Ignore if matched, already selected, or 2 cards selected
        if (card.isMatched || selectedCards.find(c => c.id === card.id) || selectedCards.length === 2) {
            return;
        }

        const newSelected = [...selectedCards, card];
        setSelectedCards(newSelected);

        if (newSelected.length === 2) {
            setMoves(m => m + 1);
            const isMatch = newSelected[0].pairId === newSelected[1].pairId;

            if (isMatch) {
                // Mark as matched
                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.id === newSelected[0].id || c.id === newSelected[1].id
                            ? { ...c, isMatched: true }
                            : c
                    ));
                    setSelectedCards([]);
                    setMatches(m => {
                        const newMatches = m + 1;
                        if (newMatches === wordPairs.length) setIsGameOver(true);
                        return newMatches;
                    });
                }, 500);
            } else {
                // Not a match, clear selection after delay
                setTimeout(() => setSelectedCards([]), 1000);
            }
        }
    };

    if (isGameOver) {
        return (
            <div className="min-h-screen bg-parla-light bg-polka p-6 flex items-center justify-center">
                <div className="feat-card max-w-lg w-full text-center space-y-6 animate-in zoom-in duration-300">
                    <h2 className="text-4xl font-brand text-parla-dark">{t.common.levelCleared}</h2>
                    <div className="text-xl text-parla-dark/80 font-bold mb-4">
                        {t.common.perfect} <span className="text-parla-blue font-black">{moves}</span> {t.wordMatch.moves}
                    </div>
                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={initializeGame} className="btn-primary w-full sm:w-auto">
                            <RefreshCw className="w-5 h-5 mr-2" /> {t.common.playAgain}
                        </button>
                        <Link href="/games" className="btn-secondary w-full sm:w-auto">
                            {t.common.exit}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-parla-mist p-4 md:p-8 flex flex-col">
            <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto w-full">
                <Link href="/games" className="text-parla-dark hover:text-parla-blue transition-colors flex items-center gap-2 font-bold">
                    <ArrowLeft className="w-5 h-5" /> {t.common.back}
                </Link>
                <div className="flex gap-4">
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm border-2 border-parla-dark/10 font-bold text-parla-dark">
                        {t.wordMatch.moves}: {moves}
                    </div>
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm border-2 border-parla-dark/10 font-bold text-parla-blue">
                        {t.wordMatch.pairs}: {matches} / {wordPairs.length}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl perspective-1000">
                    {cards.map(card => {
                        const isSelected = selectedCards.find(c => c.id === card.id);
                        const isMatched = card.isMatched;

                        // Base styles from design system
                        let cardClass = "w-full aspect-[4/3] rounded-2xl p-4 flex items-center justify-center text-xl font-bold transition-all duration-300 transform-gpu cursor-pointer select-none text-center ";

                        if (isMatched) {
                            cardClass += "bg-green-100 border-4 border-green-500/50 text-green-700 opacity-50 scale-95 pointer-events-none";
                        } else if (isSelected) {
                            cardClass += "bg-parla-blue border-4 border-parla-dark border-b-8 text-white scale-105 shadow-xl rotate-y-0";
                        } else {
                            cardClass += "bg-white border-4 border-parla-dark border-b-8 text-parla-dark hover:-translate-y-2 hover:shadow-[0_8px_0_0_#1a2f40] active:translate-y-1 active:border-b-4 active:shadow-none";
                        }

                        return (
                            <div
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                className={cardClass}
                                style={{
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                {card.text}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
