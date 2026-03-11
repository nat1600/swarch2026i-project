'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Type } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/components/games/useTranslation";

// Mock data
const mockWords = [
    { es: 'agua', en: 'water' },
    { es: 'libro', en: 'book' },
    { es: 'perro', en: 'dog' },
    { es: 'gato', en: 'cat' },
    { es: 'casa', en: 'house' },
    { es: 'feliz', en: 'happy' },
    { es: 'triste', en: 'sad' },
    { es: 'rápido', en: 'fast' },
    { es: 'lento', en: 'slow' },
    { es: 'cielo', en: 'sky' },
];

export default function TypingGame() {
    const { t } = useTranslation();
    const [currentWord, setCurrentWord] = useState(mockWords[0]);
    const [inputValue, setInputValue] = useState('');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isPlaying || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsGameOver(true);
                    setIsPlaying(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, timeLeft]);

    useEffect(() => {
        if (isPlaying && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isPlaying]);

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
        setInputValue('');
        setWordIndex(0);
        setCurrentWord(mockWords[0]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.toLowerCase() === currentWord.en.toLowerCase()) {
            // Score!
            setScore(s => s + 1);
            setInputValue('');

            // Next word
            const nextIndex = (wordIndex + 1) % mockWords.length;
            setWordIndex(nextIndex);
            setCurrentWord(mockWords[nextIndex]);
        }
    };

    if (isGameOver) {
        return (
            <div className="min-h-screen bg-parla-light bg-polka p-6 flex flex-col items-center justify-center">
                <div className="feat-card max-w-lg w-full text-center space-y-6 animate-in zoom-in duration-300">
                    <h2 className="text-4xl font-brand text-parla-dark">{t.common.gameOver}</h2>
                    <div className="text-xl text-parla-dark/80 font-bold">
                        {t.typing.start} <span className="text-6xl block text-parla-blue font-black my-4">{score}</span> {t.dashboard.games.typing.title}!
                    </div>
                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={startGame} className="btn-primary w-full sm:w-auto">
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

    if (!isPlaying) {
        return (
            <div className="min-h-screen bg-parla-mist p-6 flex items-center justify-center">
                <div className="feat-card max-w-lg w-full text-center space-y-6">
                    <Type className="w-20 h-20 mx-auto text-parla-blue" />
                    <h2 className="text-4xl font-brand text-parla-dark">{t.dashboard.games.typing.title}</h2>
                    <p className="text-xl text-parla-dark/80 font-bold mb-8">
                        {t.dashboard.games.typing.desc}
                    </p>
                    <button onClick={startGame} className="btn-primary w-full text-2xl py-6">
                        {t.typing.start}
                    </button>
                    <div className="pt-4">
                        <Link href="/games" className="text-parla-dark/60 font-bold hover:text-parla-dark flex justify-center items-center gap-2">
                            <ArrowLeft className="w-5 h-5" /> {t.common.back}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-parla-mist p-4 md:p-8 flex flex-col">
            <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border-2 border-parla-dark/10 font-bold text-parla-dark flex items-center gap-2">
                    ⏳ {timeLeft}s
                </div>
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border-2 border-parla-dark/10 font-bold text-parla-blue text-xl">
                    {t.common.score}: {score}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full relative">
                <div className="w-full max-w-2xl bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-parla-dark border-b-8 mb-8 text-center flex flex-col items-center">

                    <div className="text-sm font-bold text-parla-dark/50 uppercase tracking-widest mb-4">
                        {t.dashboard.games.typing.title}
                    </div>

                    <div className="text-6xl font-black text-parla-dark font-brand mb-12 capitalize tracking-wide">
                        {currentWord.es}
                    </div>

                    <div className="w-full relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            className="w-full text-center text-4xl font-bold p-6 bg-parla-mist rounded-2xl border-4 border-parla-dark/20 focus:border-parla-blue focus:outline-none transition-colors"
                            placeholder={t.typing.placeholder}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </div>

                </div>

                {/* Progress bar */}
                <div className="w-full max-w-2xl bg-parla-dark/10 h-4 rounded-full overflow-hidden mt-8">
                    <div
                        className="h-full bg-parla-blue transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                </div>

            </main>
        </div>
    );
}
