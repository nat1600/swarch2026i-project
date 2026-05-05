'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Timer } from 'lucide-react';
import { useTranslation } from '@/components/games/useTranslation';
import { useGameSession } from '@/hooks/useGameSession';
import { phrasesService } from '@/lib/services/phrasesService';
import { Phrase } from '@/lib/types/phrases';

import { shuffle, buildStopwatchChoices } from '@/lib/games/gameUtils';

const GAME_TIME = 60;
const POINTS_CORRECT = 50;
const POINTS_WRONG = -15;

export default function StopwatchGame() {
  const { t } = useTranslation();
  const { recordGameSession } = useGameSession();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ choice: string; correct: boolean } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phrasePoolRef = useRef<Phrase[]>([]);

  useEffect(() => {
    phrasesService.getAllPhrases().then((data) => {
      setPhrases(data.filter((p) => p.active && p.original_text?.trim() && p.translated_text?.trim()));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const pickNextPhrase = useCallback((pool: Phrase[]) => {
    const shuffled = shuffle(pool);
    const next = shuffled[0];
    setCurrentPhrase(next);
    setChoices(buildStopwatchChoices(next, pool));
    setFeedback(null);
  }, []);

  const endGame = useCallback((finalScore: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameOver(true);
    recordGameSession({ gamePlayed: 'stopwatch', points: Math.max(finalScore, 0) });
  }, [recordGameSession]);

  const startGame = useCallback(() => {
    phrasePoolRef.current = shuffle(phrases);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeLeft(GAME_TIME);
    setIsGameOver(false);
    setStarted(true);
    pickNextPhrase(phrases);
  }, [phrases, pickNextPhrase]);

  // Countdown timer
  useEffect(() => {
    if (!started || isGameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, isGameOver]);

  // Trigger recordGameSession when time runs out
  useEffect(() => {
    if (isGameOver && started) {
      if (timerRef.current) clearInterval(timerRef.current);
      recordGameSession({ gamePlayed: 'stopwatch', points: Math.max(score, 0) });
    }
  }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = useCallback((choice: string) => {
    if (feedback || !currentPhrase) return;
    const isCorrect = choice === currentPhrase.translated_text;
    setFeedback({ choice, correct: isCorrect });
    if (isCorrect) {
      setScore((s) => s + POINTS_CORRECT);
      setCorrectCount((c) => c + 1);
    } else {
      setScore((s) => s + POINTS_WRONG);
      setWrongCount((c) => c + 1);
    }
    setTimeout(() => pickNextPhrase(phrases), 800);
  }, [feedback, currentPhrase, phrases, pickNextPhrase]);

  const timerPercent = (timeLeft / GAME_TIME) * 100;
  const timerColor = timeLeft > 20 ? '#3b82f6' : timeLeft > 10 ? '#f59e0b' : '#ef4444';

  if (loading) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-parla-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phrases.length < 4) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center p-6">
        <div className="feat-card max-w-md w-full text-center space-y-6">
          <p className="text-xl font-black text-parla-dark">{t.common.notEnoughPhrases}</p>
          <Link href="/vocabulary" className="btn-primary inline-flex">{t.common.goToVocabulary}</Link>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center p-6">
        <div className="feat-card max-w-lg w-full text-center space-y-6 animate-in zoom-in duration-300">
          <h2 className="text-5xl font-brand text-parla-dark">{t.common.gameOver}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-parla-mist rounded-2xl p-4 border-4 border-parla-dark shadow-[0_4px_0_0_#254159]">
              <p className="font-black text-3xl text-parla-blue">{Math.max(score, 0)}</p>
              <p className="text-xs font-black text-parla-dark/60 uppercase tracking-widest">{t.common.xpEarned}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 border-4 border-green-500 shadow-[0_4px_0_0_#16a34a]">
              <p className="font-black text-3xl text-green-600">{correctCount}</p>
              <p className="text-xs font-black text-green-700/60 uppercase tracking-widest">{t.common.correct}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border-4 border-red-400 shadow-[0_4px_0_0_#ef4444]">
              <p className="font-black text-3xl text-red-500">{wrongCount}</p>
              <p className="text-xs font-black text-red-600/60 uppercase tracking-widest">{t.common.wrong}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button onClick={startGame} className="btn-primary w-full sm:w-auto">
              <RefreshCw className="w-5 h-5 mr-2" /> {t.common.playAgain}
            </button>
            <Link href="/games" className="btn-secondary w-full sm:w-auto">{t.common.exit}</Link>
          </div>
        </div>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div className="min-h-screen bg-polka flex flex-col items-center justify-center p-6 gap-8">
        <Link href="/games" className="text-parla-dark hover:text-parla-blue font-bold flex items-center gap-2 self-start max-w-2xl mx-auto w-full">
          <ArrowLeft className="w-5 h-5" /> {t.common.back}
        </Link>
        <div className="feat-card max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-orange-50 border-4 border-orange-400 flex items-center justify-center mx-auto shadow-[0_6px_0_0_#f97316]">
            <Timer className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="font-brand text-4xl text-parla-dark">{t.dashboard.games.stopwatch.title}</h1>
          <p className="font-bold text-parla-dark/70">{t.stopwatch.chooseCorrect}</p>
          <ul className="text-left space-y-2 text-sm font-bold text-parla-dark/70">
            <li>⏱ {GAME_TIME} segundos para responder el máximo posible</li>
            <li>✅ +{POINTS_CORRECT} XP por respuesta correcta</li>
            <li>❌ {POINTS_WRONG} XP por respuesta incorrecta</li>
          </ul>
          <button onClick={startGame} className="btn-primary w-full text-xl py-4">
            ¡Comenzar!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-polka p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-6 max-w-2xl mx-auto w-full">
        <Link href="/games" className="text-parla-dark hover:text-parla-blue font-bold flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> {t.common.back}
        </Link>
        <div className="flex gap-3 items-center">
          <div className="bg-white rounded-xl px-4 py-2 border-4 border-parla-blue shadow-[0_4px_0_0_#2563eb] font-black text-parla-blue">
            {Math.max(score, 0)} XP
          </div>
          <div
            className="bg-white rounded-xl px-4 py-2 border-4 font-black text-2xl transition-all"
            style={{ borderColor: timerColor, color: timerColor, boxShadow: `0 4px 0 0 ${timerColor}` }}
          >
            {timeLeft}s
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div className="max-w-2xl mx-auto w-full mb-6 h-3 bg-parla-dark/10 rounded-full overflow-hidden border-2 border-parla-dark/20">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6">
        {currentPhrase && (
          <>
            {/* Question */}
            <div className="bg-white rounded-3xl border-8 border-parla-dark shadow-[0_12px_0_0_#254159] p-8 w-full text-center">
              <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest mb-3">{t.stopwatch.question}...</p>
              <p className="text-3xl md:text-4xl font-brand text-parla-dark">{currentPhrase.original_text}</p>
              {currentPhrase.pronunciation && (
                <p className="text-sm font-bold text-parla-dark/40 mt-2">[{currentPhrase.pronunciation}]</p>
              )}
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {choices.map((choice) => {
                const isChosen = feedback?.choice === choice;
                const isCorrectAnswer = currentPhrase.translated_text === choice;
                let cls = 'w-full rounded-2xl border-4 px-6 py-4 font-black text-lg transition-all duration-200 text-center cursor-pointer ';
                if (feedback) {
                  if (isCorrectAnswer) cls += 'bg-green-100 border-green-500 text-green-700 shadow-[0_4px_0_0_#16a34a]';
                  else if (isChosen) cls += 'bg-red-100 border-red-400 text-red-600 shadow-[0_4px_0_0_#ef4444]';
                  else cls += 'bg-white border-parla-dark/20 text-parla-dark/40 opacity-50';
                } else {
                  cls += 'bg-white border-parla-dark text-parla-dark hover:-translate-y-1 hover:shadow-[0_8px_0_0_#254159] shadow-[0_4px_0_0_#254159] active:translate-y-0 active:shadow-none';
                }
                return (
                  <button key={choice} onClick={() => handleChoice(choice)} className={cls} disabled={!!feedback}>
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
