'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  documentId: string;
  text: string;
  options: string[];
}

interface Props {
  quizId: string;
  questions: Question[];
  courseId: string;
}

interface Result {
  score: number;
  correct: number;
  total: number;
}

export default function QuizForm({ quizId, questions, courseId }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  function handleAnswer(questionDocId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionDocId]: optionIndex }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate all questions answered
    const unanswered = questions.filter(
      (q) => answers[q.documentId] === undefined
    );
    if (unanswered.length > 0) {
      setError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only send the selected indices — grading happens server-side, never here
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data === 'string' ? data : data.error || 'Submission failed.');
        return;
      }

      setResult({ score: data.score, correct: data.correct, total: data.total });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // --- Result Screen ---
  if (result) {
    const passed = result.score >= 60;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-6">
        <div className={`text-6xl font-black ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
          {result.score}%
        </div>
        <div>
          <p className={`text-xl font-bold ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {passed ? '🎉 Well done!' : '📚 Keep studying!'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            You got {result.correct} out of {result.total} questions correct.
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href={`/courses/${courseId}`}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition-all"
          >
            ← Back to Course
          </Link>
          <Link
            href="/my-courses"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all"
          >
            My Courses →
          </Link>
        </div>
      </div>
    );
  }

  // --- Quiz Form ---
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((question, idx) => (
        <div
          key={question.documentId || question.id}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <p className="font-semibold text-white text-base">
            <span className="text-indigo-400 mr-2">Q{idx + 1}.</span>
            {question.text}
          </p>
          <div className="space-y-2">
            {question.options.map((option, optIdx) => {
              const isSelected = answers[question.documentId] === optIdx;
              return (
                <label
                  key={optIdx}
                  htmlFor={`q-${question.documentId}-opt-${optIdx}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    id={`q-${question.documentId}-opt-${optIdx}`}
                    name={`question-${question.documentId}`}
                    checked={isSelected}
                    onChange={() => handleAnswer(question.documentId, optIdx)}
                    className="accent-indigo-500 w-4 h-4 shrink-0"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        id="submit-quiz-btn"
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Grading…
          </span>
        ) : (
          'Submit Quiz →'
        )}
      </button>
      <p className="text-xs text-slate-500 text-center">
        Grading is performed server-side. Your score is computed securely.
      </p>
    </form>
  );
}
