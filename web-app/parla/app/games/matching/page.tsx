'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/components/games/useTranslation';
import { useGameSession } from '@/hooks/useGameSession';
import { phrasesService } from '@/lib/services/phrasesService';
import { Phrase } from '@/lib/types/phrases';

const PAIR_COUNT = 6;
const POINTS_CORRECT = 75;
const POINTS_WRONG = -25;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MatchCard {
  id: string;
  phraseId: number;
  text: string;
  side: 'original' | 'translation';
  matched: boolean;
}

function buildCards(pairs: Phrase[]): { originals: MatchCard[]; translations: MatchCard[] } {
  const originals: MatchCard[] = shuffle(
    pairs.map((p) => ({ id: `o-${p.id}`, phraseId: p.id, text: p.original_text, side: 'original' as const, matched: false }))
  );
  const translations: MatchCard[] = shuffle(
    pairs.map((p) => ({ id: `t-${p.id}`, phraseId: p.id, text: p.translated_text, side: 'translation' as const, matched: false }))
  );
  return { originals, translations };
}

export default function MatchingGame() {
  const { t } = useTranslation();
  const { recordGameSession } = useGameSession();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [originals, setOriginals] = useState<MatchCard[]>([]);
  const [translations, setTranslations] = useState<MatchCard[]>([]);
  const [selectedOriginal, setSelectedOriginal] = useState<MatchCard | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<MatchCard | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [mismatches, setMismatches] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activePairs, setActivePairs] = useState<Phrase[]>([]);

  useEffect(() => {
    phrasesService.getAllPhrases().then((data) => {
      setPhrases(data.filter((p) => p.active));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const initGame = useCallback((pool: Phrase[]) => {
    const pairs = shuffle(pool).slice(0, PAIR_COUNT);
    setActivePairs(pairs);
    const { originals: o, translations: tr } = buildCards(pairs);
    setOriginals(o);
    setTranslations(tr);
    setSelectedOriginal(null);
    setSelectedTranslation(null);
    setWrongPair(null);
    setMatchedCount(0);
    setScore(0);
    setMismatches(0);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    if (phrases.length >= 4) initGame(phrases);
  }, [phrases, initGame]);

  useEffect(() => {
    if (isGameOver) {
      recordGameSession({ gamePlayed: 'matching', points: Math.max(score, 0) });
    }
  }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOriginalClick = (card: MatchCard) => {
    if (card.matched || wrongPair) return;
    setSelectedOriginal(card);
  };

  const handleTranslationClick = useCallback((card: MatchCard) => {
    if (card.matched || wrongPair || !selectedOriginal) return;
    setSelectedTranslation(card);

    const isMatch = selectedOriginal.phraseId === card.phraseId;

    if (isMatch) {
      const newScore = score + POINTS_CORRECT;
      setScore(newScore);
      const newMatchedCount = matchedCount + 1;
      setMatchedCount(newMatchedCount);

      setOriginals((prev) => prev.map((c) => c.phraseId === card.phraseId ? { ...c, matched: true } : c));
      setTranslations((prev) => prev.map((c) => c.phraseId === card.phraseId ? { ...c, matched: true } : c));
      setSelectedOriginal(null);
      setSelectedTranslation(null);

      if (newMatchedCount >= Math.min(PAIR_COUNT, activePairs.length)) {
        setIsGameOver(true);
      }
    } else {
      setMismatches((m) => m + 1);
      setScore((s) => s + POINTS_WRONG);
      setWrongPair([selectedOriginal.id, card.id]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedOriginal(null);
        setSelectedTranslation(null);
      }, 800);
    }
  }, [selectedOriginal, score, matchedCount, activePairs.length, wrongPair]);

  const getCardClass = (card: MatchCard, isSelected: boolean, isWrong: boolean) => {
    let cls = 'rounded-2xl border-4 p-3 text-sm font-black cursor-pointer transition-all duration-200 text-center min-h-[72px] flex items-center justify-center leading-tight ';
    if (card.matched) {
      cls += 'bg-green-100 border-green-500 text-green-700 opacity-60 pointer-events-none shadow-[0_4px_0_0_#16a34a]';
    } else if (isWrong) {
      cls += 'bg-red-100 border-red-400 text-red-600 shadow-[0_4px_0_0_#ef4444] scale-95';
    } else if (isSelected) {
      cls += 'bg-parla-blue border-parla-dark text-white shadow-[0_6px_0_0_#254159] scale-105';
    } else {
      cls += 'bg-white border-parla-dark text-parla-dark hover:-translate-y-1 hover:shadow-[0_8px_0_0_#254159] shadow-[0_4px_0_0_#254159] active:translate-y-0 active:shadow-none';
    }
    return cls;
  };

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
          <h2 className="text-5xl font-brand text-parla-dark">{t.common.levelCleared}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-parla-mist rounded-2xl p-4 border-4 border-parla-dark shadow-[0_4px_0_0_#254159]">
              <p className="font-black text-3xl text-parla-blue">{Math.max(score, 0)}</p>
              <p className="text-xs font-black text-parla-dark/60 uppercase tracking-widest">{t.common.xpEarned}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 border-4 border-green-500 shadow-[0_4px_0_0_#16a34a]">
              <p className="font-black text-3xl text-green-600">{matchedCount}</p>
              <p className="text-xs font-black text-green-700/60 uppercase tracking-widest">{t.matching.pairs}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border-4 border-red-400 shadow-[0_4px_0_0_#ef4444]">
              <p className="font-black text-3xl text-red-500">{mismatches}</p>
              <p className="text-xs font-black text-red-600/60 uppercase tracking-widest">{t.matching.mismatches}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button onClick={() => initGame(phrases)} className="btn-primary w-full sm:w-auto">
              <RefreshCw className="w-5 h-5 mr-2" /> {t.common.playAgain}
            </button>
            <Link href="/games" className="btn-secondary w-full sm:w-auto">{t.common.exit}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-polka p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-6 max-w-4xl mx-auto w-full">
        <Link href="/games" className="text-parla-dark hover:text-parla-blue font-bold flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> {t.common.back}
        </Link>
        <div className="flex gap-3">
          <div className="bg-white rounded-xl px-4 py-2 border-4 border-parla-dark shadow-[0_4px_0_0_#254159] font-bold text-parla-dark">
            {matchedCount} / {Math.min(PAIR_COUNT, activePairs.length)} {t.matching.pairs}
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border-4 border-parla-blue shadow-[0_4px_0_0_#2563eb] font-black text-parla-blue">
            {Math.max(score, 0)} XP
          </div>
        </div>
      </header>

      <p className="text-center font-black text-parla-dark/60 mb-6 max-w-4xl mx-auto w-full">
        {selectedOriginal
          ? `"${selectedOriginal.text}" → ${t.matching.translation}?`
          : t.matching.instruction}
      </p>

      <main className="flex-1 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-6">
          {/* Originals column */}
          <div className="space-y-3">
            <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest text-center mb-2">
              {t.matching.original}
            </p>
            {originals.map((card) => {
              const isSelected = selectedOriginal?.id === card.id;
              const isWrong = wrongPair?.[0] === card.id;
              return (
                <div key={card.id} onClick={() => handleOriginalClick(card)} className={getCardClass(card, isSelected, !!isWrong)}>
                  {card.text}
                </div>
              );
            })}
          </div>

          {/* Translations column */}
          <div className="space-y-3">
            <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest text-center mb-2">
              {t.matching.translation}
            </p>
            {translations.map((card) => {
              const isSelected = selectedTranslation?.id === card.id;
              const isWrong = wrongPair?.[1] === card.id;
              const isClickable = !!selectedOriginal && !card.matched;
              return (
                <div
                  key={card.id}
                  onClick={() => isClickable ? handleTranslationClick(card) : undefined}
                  className={`${getCardClass(card, isSelected, !!isWrong)} ${!isClickable && !card.matched ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {card.text}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
