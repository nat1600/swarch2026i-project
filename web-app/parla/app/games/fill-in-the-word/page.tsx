'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useTranslation } from '@/components/games/useTranslation';
import { useGameSession } from '@/hooks/useGameSession';
import { phrasesService } from '@/lib/services/phrasesService';
import { Phrase } from '@/lib/types/phrases';

import { shuffle, buildFillRound, FillRound } from '@/lib/games/gameUtils';

const POINTS_CORRECT = 100;
const POINTS_HINT = 60;
const POINTS_WRONG = -10;
const TOTAL_ROUNDS = 8;

type RoundState = FillRound;

export default function FillInTheWordGame() {
  const { t } = useTranslation();
  const { recordGameSession } = useGameSession();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState<RoundState[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    phrasesService.getAllPhrases().then((data) => {
      setPhrases(data.filter((p) => p.active));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const buildGame = useCallback((pool: Phrase[]) => {
    const shuffled = shuffle(pool);
    const built: RoundState[] = [];
    for (const p of shuffled) {
      if (built.length >= TOTAL_ROUNDS) break;
      const r = buildFillRound(p);
      if (r) built.push(r as RoundState);
    }
    return built;
  }, []);

  useEffect(() => {
    if (phrases.length >= 4) {
      setRounds(buildGame(phrases));
    }
  }, [phrases, buildGame]);

  useEffect(() => {
    if (isGameOver) {
      recordGameSession({ gamePlayed: 'fill-in-the-word', points: Math.max(score, 0) });
    }
  }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRound = rounds[roundIdx];

  const handleCheck = useCallback(() => {
    if (!currentRound || feedback) return;
    const isCorrect = input.trim().toLowerCase() === currentRound.answer.toLowerCase();
    if (isCorrect) {
      const pts = usedHint ? POINTS_HINT : POINTS_CORRECT;
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      setFeedback('correct');
    } else {
      setScore((s) => s + POINTS_WRONG);
      setWrongCount((c) => c + 1);
      setFeedback('wrong');
    }
  }, [currentRound, feedback, input, usedHint]);

  const handleNext = useCallback(() => {
    const next = roundIdx + 1;
    if (next >= rounds.length) {
      setIsGameOver(true);
    } else {
      setRoundIdx(next);
      setInput('');
      setFeedback(null);
      setUsedHint(false);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [roundIdx, rounds.length]);

  const handleHint = () => {
    setUsedHint(true);
    setShowHint(true);
  };

  const restartGame = useCallback(() => {
    setRounds(buildGame(phrases));
    setRoundIdx(0);
    setInput('');
    setFeedback(null);
    setUsedHint(false);
    setShowHint(false);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsGameOver(false);
  }, [buildGame, phrases]);

  if (loading) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-parla-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-black text-parla-dark text-xl">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (phrases.length < 4) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center p-6">
        <div className="feat-card max-w-md w-full text-center space-y-6">
          <p className="text-xl font-black text-parla-dark">{t.common.notEnoughPhrases}</p>
          <Link href="/vocabulary" className="btn-primary inline-flex">
            {t.common.goToVocabulary}
          </Link>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center p-6">
        <div className="feat-card max-w-lg w-full text-center space-y-6 animate-in zoom-in duration-300">
          <h2 className="text-5xl font-brand text-parla-dark">{t.common.levelCleared}</h2>
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
            <button onClick={restartGame} className="btn-primary w-full sm:w-auto">
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

  if (!currentRound) return null;

  return (
    <div className="min-h-screen bg-polka p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-8 max-w-2xl mx-auto w-full">
        <Link href="/games" className="text-parla-dark hover:text-parla-blue transition-colors flex items-center gap-2 font-bold">
          <ArrowLeft className="w-5 h-5" /> {t.common.back}
        </Link>
        <div className="flex gap-3">
          <div className="bg-white rounded-xl px-4 py-2 border-4 border-parla-dark shadow-[0_4px_0_0_#254159] font-bold text-parla-dark">
            {roundIdx + 1} / {rounds.length}
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border-4 border-parla-blue shadow-[0_4px_0_0_#2563eb] font-black text-parla-blue">
            {Math.max(score, 0)} XP
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-8">
        {/* Translation hint */}
        <div className="bg-white rounded-2xl border-4 border-parla-dark shadow-[0_6px_0_0_#254159] p-5 w-full text-center">
          <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest mb-2">
            {currentRound.phrase.target_language?.name ?? 'Traducción'}
          </p>
          <p className="text-2xl font-black text-parla-blue">{currentRound.phrase.translated_text}</p>
        </div>

        {/* Phrase with blank */}
        <div className="bg-white rounded-3xl border-8 border-parla-dark shadow-[0_12px_0_0_#254159] p-8 w-full text-center">
          <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest mb-4">{t.fillInTheWord.instruction}</p>
          <p className="text-3xl md:text-4xl font-brand text-parla-dark leading-relaxed tracking-wide">
            {currentRound.display}
          </p>
        </div>

        {/* Input */}
        <div className="w-full space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') feedback ? handleNext() : handleCheck(); }}
            placeholder={t.fillInTheWord.placeholder}
            disabled={!!feedback}
            className="w-full text-xl font-black text-center border-4 border-parla-dark rounded-2xl px-6 py-4 shadow-[0_6px_0_0_#254159] focus:outline-none focus:border-parla-blue focus:shadow-[0_6px_0_0_#2563eb] transition-all disabled:opacity-60 bg-white"
            autoFocus
          />

          {/* Feedback */}
          {feedback === 'correct' && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-black text-lg animate-in slide-in-from-bottom duration-200">
              <CheckCircle className="w-6 h-6" /> {t.common.perfect} +{usedHint ? POINTS_HINT : POINTS_CORRECT} XP
            </div>
          )}
          {feedback === 'wrong' && (
            <div className="flex items-center justify-center gap-2 text-red-500 font-black text-lg animate-in slide-in-from-bottom duration-200">
              <XCircle className="w-6 h-6" /> {currentRound.answer}
            </div>
          )}
          {showHint && !feedback && (
            <p className="text-center font-black text-parla-dark/60">
              {t.fillInTheWord.hintLetter} &quot;<span className="text-parla-blue">{currentRound.hintLetter}</span>&quot;
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full">
          {!feedback && !showHint && (
            <button onClick={handleHint} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5" /> Pista
            </button>
          )}
          {!feedback ? (
            <button onClick={handleCheck} disabled={!input.trim()} className="btn-primary flex-1 disabled:opacity-40">
              {t.fillInTheWord.check}
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary flex-1">
              {t.fillInTheWord.next} →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
