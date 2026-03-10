'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/components/games/useTranslation";

// Mock data for the game
const mockQuestions = [
    {
        id: 1,
        sentence: "The cat is sleeping on the _ .",
        options: ["sofa", "dog", "apple", "sky"],
        correctAnswer: "sofa",
        translation: "El gato está durmiendo en el sofá."
    },
    {
        id: 2,
        sentence: "I need to buy some _ at the supermarket.",
        options: ["water", "shoes", "cars", "houses"],
        correctAnswer: "water",
        translation: "Necesito comprar algo de agua en el supermercado."
    },
    {
        id: 3,
        sentence: "She is reading a very interesting _ .",
        options: ["movie", "book", "song", "food"],
        correctAnswer: "book",
        translation: "Ella está leyendo un libro muy interesante."
    }
];

export default function FillInTheBlankGame() {
    const { t } = useTranslation();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);

    const currentQuestion = mockQuestions[currentQuestionIndex];

    const handleSelectWord = (word: string) => {
        if (isChecked) return;
        setSelectedWord(word);
    };

    const handleCheck = () => {
        if (!selectedWord) return;

        const correct = selectedWord === currentQuestion.correctAnswer;
        setIsCorrect(correct);
        setIsChecked(true);

        if (correct) {
            setScore(s => s + 1);
        }
    };

    const handleNext = () => {
        setSelectedWord(null);
        setIsChecked(false);
        setIsCorrect(false);

        if (currentQuestionIndex < mockQuestions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            setIsGameOver(true);
        }
    };

    const resetGame = () => {
        setCurrentQuestionIndex(0);
        setSelectedWord(null);
        setIsChecked(false);
        setIsCorrect(false);
        setScore(0);
        setIsGameOver(false);
    };

    if (isGameOver) {
        return (
            <div className="min-h-screen bg-parla-light bg-polka p-6 flex items-center justify-center">
                <div className="feat-card max-w-lg w-full text-center space-y-6 animate-in zoom-in duration-300">
                    <h2 className="text-4xl font-brand text-parla-dark">{t.common.gameOver}</h2>
                    <div className="text-6xl font-black text-parla-blue my-8">
                        {score} / {mockQuestions.length}
                    </div>
                    <p className="text-lg text-parla-dark/80 font-bold">
                        {score === mockQuestions.length ? t.common.perfect : t.common.keepGoing}
                    </p>
                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={resetGame} className="btn-primary w-full sm:w-auto">
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

    // Split sentence to insert the blank
    const sentenceParts = currentQuestion.sentence.split('_');

    return (
        <div className="min-h-screen bg-parla-mist p-4 md:p-8 flex flex-col">
            <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto w-full">
                <Link href="/games" className="text-parla-dark hover:text-parla-blue transition-colors flex items-center gap-2 font-bold">
                    <ArrowLeft className="w-5 h-5" /> {t.common.back}
                </Link>
                <div className="bg-white rounded-full px-6 py-2 shadow-sm border-2 border-parla-dark/10 font-black text-parla-dark text-lg">
                    {currentQuestionIndex + 1} / {mockQuestions.length}
                </div>
                <div className="font-black text-parla-blue text-xl">
                    {t.common.score}: {score}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                <div className="w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-parla-dark border-b-8 mb-8 relative overflow-hidden">

                    {/* Question Text */}
                    <div className="text-3xl md:text-5xl font-bold text-center text-parla-dark leading-relaxed mb-8">
                        {sentenceParts[0]}
                        <span className={`
              inline-block min-w-[120px] pb-1 px-4 mx-2 border-b-4 border-dashed
              ${selectedWord ? 'border-transparent' : 'border-parla-dark/30 text-transparent'}
              ${isChecked && isCorrect ? 'text-green-500' : ''}
              ${isChecked && !isCorrect ? 'text-parla-red' : ''}
              transition-colors
            `}>
                            {selectedWord || '_____'}
                        </span>
                        {sentenceParts[1]}
                    </div>

                    <p className="text-center text-parla-dark/60 font-medium text-lg italic mb-12">
                        &quot;{currentQuestion.translation}&quot;
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentQuestion.options.map((option) => {
                            const isSelected = selectedWord === option;
                            let btnClass = "btn-secondary !w-full !px-4 !py-4 text-xl capitalize";

                            if (isSelected && !isChecked) {
                                btnClass = "btn-primary !w-full !border-[#8C0327] !bg-[#BF0436] !text-white !px-4 !py-4 text-xl capitalize";
                            } else if (isChecked) {
                                if (option === currentQuestion.correctAnswer) {
                                    btnClass = "!bg-green-500 !text-white !border-green-700 !border-b-8 rounded-2xl font-black text-xl w-full py-4 capitalize opacity-100 flex items-center justify-center gap-2";
                                } else if (isSelected && !isCorrect) {
                                    btnClass = "!bg-parla-red !text-white !border-[#8C0327] !border-b-8 rounded-2xl font-black text-xl w-full py-4 capitalize opacity-50 flex items-center justify-center gap-2";
                                } else {
                                    btnClass = "btn-secondary !w-full !px-4 !py-4 text-xl capitalize opacity-50 cursor-not-allowed";
                                }
                            }

                            return (
                                <button
                                    key={option}
                                    onClick={() => handleSelectWord(option)}
                                    disabled={isChecked}
                                    className={btnClass}
                                    style={{ transform: isChecked ? 'none' : undefined }}
                                >
                                    {option}
                                    {isChecked && option === currentQuestion.correctAnswer && <CheckCircle2 className="w-5 h-5 absolute right-4" />}
                                    {isChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 absolute right-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Actions Context Menu */}
                <div className={`h-24 transition-all duration-300 w-full max-w-md ${selectedWord ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    {!isChecked ? (
                        <button
                            onClick={handleCheck}
                            className="btn-primary w-full shadow-xl text-2xl py-5"
                        >
                            Verificar respuesta
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="btn-primary w-full shadow-xl text-2xl py-5 !bg-parla-dark !border-[#1a2f40]"
                        >
                            Continuar
                        </button>
                    )}
                </div>

            </main>
        </div>
    );
}
