'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '@/components/games/useTranslation';
import { useGameSession } from '@/hooks/useGameSession';
import { phrasesService } from '@/lib/services/phrasesService';
import { Phrase } from '@/lib/types/phrases';
import { shuffle, buildFillRound, FillRound } from '@/lib/games/gameUtils';
import { getEnrichedPhrases, EnrichedPhrase } from '@/lib/services/phrasesService';

const POINTS_CORRECT = 100;
const POINTS_WRONG = -15;
const TOTAL_ROUNDS = 8;

export default function FillInTheWordGame() {
  const { t } = useTranslation();
  const { recordGameSession } = useGameSession();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState<FillRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const [enrichedMap, setEnrichedMap] = useState<Map<number, EnrichedPhrase[]>>(new Map());

  useEffect(() => {
    phrasesService.getAllPhrases()
      .then(async (data) => {
        const valid = data.filter((p) => p.active && p.original_text?.trim() && p.translated_text?.trim());
        setPhrases(valid);

        // Fetch enrichment data for all phrase IDs in parallel
        const enriched = await getEnrichedPhrases(valid.map((p) => p.id));
        const map = new Map<number, EnrichedPhrase[]>();
        for (const e of enriched) {
          const list = map.get(e.phrase_id) ?? [];
          list.push(e);
          map.set(e.phrase_id, list);
        }
        setEnrichedMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buildGame = useCallback((pool: Phrase[], eMap: Map<number, EnrichedPhrase[]>) => {
    const built: FillRound[] = [];
    for (const p of shuffle(pool)) {
      if (built.length >= TOTAL_ROUNDS) break;

      // Prefer enriched data from the enrichment-service (LLM-generated)
      // Filter out proper nouns (capitalized words like names, countries, cities)
      const rawList = eMap.get(p.id) ?? [];
      const enrichedList = rawList.filter((e) => e.word && /^[a-z]/.test(e.word));
      if (enrichedList.length > 0) {
        const e = enrichedList[Math.floor(Math.random() * enrichedList.length)];
        built.push({
          display: e.sentence,
          answer: e.correct_answer,
          choices: shuffle([e.correct_answer, ...e.distractors]).slice(0, 4),
          phrase: p,
        });
        continue;
      }

      // Fallback: local word-picking
      const r = buildFillRound(p, pool);
      if (r) built.push(r);
    }
    return built;
  }, []);

  useEffect(() => {
    if (phrases.length >= 4) setRounds(buildGame(phrases, enrichedMap));
  }, [phrases, enrichedMap, buildGame]);

  useEffect(() => {
    if (isGameOver) {
      recordGameSession({ gamePlayed: 'fill-in-the-word', points: Math.max(score, 0) });
    }
  }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRound = rounds[roundIdx];

  const handleChoice = useCallback((choice: string) => {
    if (feedback) return;
    setSelected(choice);
    const isCorrect = choice.toLowerCase() === currentRound.answer.toLowerCase();
    if (isCorrect) {
      setScore((s) => s + POINTS_CORRECT);
      setCorrectCount((c) => c + 1);
      setFeedback('correct');
    } else {
      setScore((s) => s + POINTS_WRONG);
      setWrongCount((c) => c + 1);
      setFeedback('wrong');
    }
  }, [currentRound, feedback]);

  const handleNext = useCallback(() => {
    const next = roundIdx + 1;
    if (next >= rounds.length) {
      setIsGameOver(true);
    } else {
      setRoundIdx(next);
      setSelected(null);
      setFeedback(null);
    }
  }, [roundIdx, rounds.length]);

  const restartGame = useCallback(() => {
    setRounds(buildGame(phrases, enrichedMap));
    setRoundIdx(0);
    setSelected(null);
    setFeedback(null);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsGameOver(false);
  }, [buildGame, phrases, enrichedMap]);

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

      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6">
        {/* Original phrase context — no highlight to avoid giving away the answer */}
        <div className="bg-parla-mist rounded-2xl border-4 border-parla-dark/30 p-4 w-full text-center space-y-1">
          <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest">
            {t.fillInTheWord.phraseContext ?? 'Tu frase guardada'}
          </p>
          <p className="text-sm font-semibold text-parla-dark/70 italic leading-relaxed">
            &ldquo;{currentRound.phrase.original_text}&rdquo;
          </p>
          <p className="text-xs text-parla-dark/40 font-semibold">
            ↓ La palabra que falta en el ejercicio proviene de esta frase
          </p>
        </div>

        {/* Phrase with blank */}
        <div className="bg-white rounded-3xl border-8 border-parla-dark shadow-[0_12px_0_0_#254159] p-8 w-full text-center">
          <p className="text-xs font-black text-parla-dark/50 uppercase tracking-widest mb-4">
            {t.fillInTheWord.instruction}
          </p>
          <p className="text-3xl md:text-4xl font-brand text-parla-dark leading-relaxed tracking-wide">
            {currentRound.display.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`inline-block min-w-[4rem] border-b-4 mx-1 align-bottom transition-colors ${
                    feedback === 'correct' ? 'border-green-500 text-green-600' :
                    feedback === 'wrong' ? 'border-red-400 text-red-500' :
                    'border-parla-blue'
                  }`}>
                    {feedback ? (
                      <span className="font-black text-2xl">{currentRound.answer}</span>
                    ) : (
                      <span className="opacity-0 text-2xl">{'_'.repeat(currentRound.answer.length)}</span>
                    )}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Feedback banner */}
        {feedback === 'correct' && (
          <div className="flex items-center gap-2 text-green-600 font-black text-lg animate-in slide-in-from-bottom duration-200">
            <CheckCircle className="w-6 h-6" /> {t.common.perfect} +{POINTS_CORRECT} XP
          </div>
        )}
        {feedback === 'wrong' && (
          <div className="flex items-center gap-2 text-red-500 font-black text-lg animate-in slide-in-from-bottom duration-200">
            <XCircle className="w-6 h-6" /> La respuesta era &quot;{currentRound.answer}&quot;
          </div>
        )}

        {/* Multiple choice buttons */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {currentRound.choices.map((choice) => {
            const isSelected = selected === choice;
            const isAnswer = choice.toLowerCase() === currentRound.answer.toLowerCase();
            let btnClass = 'w-full py-4 px-5 rounded-2xl border-4 font-black text-lg transition-all ';

            if (!feedback) {
              btnClass += 'border-parla-dark shadow-[0_4px_0_0_#254159] bg-white hover:bg-parla-mist hover:scale-[1.02] cursor-pointer';
            } else if (isAnswer) {
              btnClass += 'border-green-500 shadow-[0_4px_0_0_#16a34a] bg-green-50 text-green-700 scale-[1.02]';
            } else if (isSelected && !isAnswer) {
              btnClass += 'border-red-400 shadow-[0_4px_0_0_#ef4444] bg-red-50 text-red-600 opacity-80';
            } else {
              btnClass += 'border-parla-dark/30 bg-white/60 text-parla-dark/40 opacity-50';
            }

            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                disabled={!!feedback}
                className={btnClass}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {feedback && (
          <button onClick={handleNext} className="btn-primary w-full animate-in slide-in-from-bottom duration-200">
            {roundIdx + 1 >= rounds.length ? 'Ver resultados' : `${t.fillInTheWord.next} →`}
          </button>
        )}
      </main>
    </div>
  );
}
