'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export default function QuizBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const courseId = params.id;
  const router = useRouter();

  // --- Quiz title state ---
  const [quizTitle, setQuizTitle] = useState('');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizCreating, setQuizCreating] = useState(false);
  const [quizError, setQuizError] = useState('');

  // --- Question form state ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qAdding, setQAdding] = useState(false);
  const [qError, setQError] = useState('');

  // Step 1: Create the quiz
  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault();
    setQuizCreating(true);
    setQuizError('');
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: quizTitle, courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuizError(typeof data === 'string' ? data : data.error || 'Failed to create quiz');
        return;
      }
      setQuizId(data.data?.documentId || data.data?.id);
    } catch {
      setQuizError('Network error');
    } finally {
      setQuizCreating(false);
    }
  }

  // Step 2: Add a question
  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!quizId) return;
    const filledOptions = qOptions.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      setQError('Please provide at least 2 options.');
      return;
    }
    setQAdding(true);
    setQError('');
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: qText, options: qOptions, correctOptionIndex: qCorrect }),
      });
      if (!res.ok) {
        const data = await res.json();
        setQError(data.error || 'Failed to add question');
        return;
      }
      setQuestions((prev) => [
        ...prev,
        { text: qText, options: [...qOptions], correctOptionIndex: qCorrect },
      ]);
      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrect(0);
    } catch {
      setQError('Network error');
    } finally {
      setQAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <Link
            href={`/instructor`}
            className="text-sm text-slate-400 hover:text-white transition-colors font-semibold"
          >
            ← Back to Instructor Portal
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white">Quiz Builder</h1>
          <p className="text-slate-400 text-sm mt-1">Create a quiz and add MCQ questions for this course.</p>
        </div>

        {/* Step 1: Create Quiz */}
        {!quizId ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-white">Step 1 — Name the Quiz</h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                  Quiz Title
                </label>
                <input
                  id="quiz-title-input"
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required
                  placeholder="e.g. Chapter 1 Assessment"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              {quizError && <p className="text-red-400 text-xs">{quizError}</p>}
              <button
                id="create-quiz-btn"
                type="submit"
                disabled={quizCreating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-semibold rounded-xl text-sm transition-all"
              >
                {quizCreating ? 'Creating…' : 'Create Quiz →'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Step 2: Add Questions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Step 2 — Add Questions</h2>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                  ✓ Quiz Created
                </span>
              </div>

              {/* Questions Added So Far */}
              {questions.length > 0 && (
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-1">
                      <p className="text-sm font-semibold text-white">Q{i + 1}: {q.text}</p>
                      <ul className="space-y-0.5 mt-2">
                        {q.options.map((opt, j) => (
                          <li
                            key={j}
                            className={`text-xs px-2 py-1 rounded-lg ${
                              j === q.correctOptionIndex
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-slate-400'
                            }`}
                          >
                            {j === q.correctOptionIndex ? '✓ ' : ''}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Question Form */}
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                    Question Text
                  </label>
                  <input
                    id="question-text-input"
                    type="text"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    required
                    placeholder="e.g. What is the capital of France?"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Answer Options (mark correct one)
                  </label>
                  {qOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOption"
                        id={`opt-radio-${i}`}
                        checked={qCorrect === i}
                        onChange={() => setQCorrect(i)}
                        className="accent-emerald-500 w-4 h-4 shrink-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[i] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">Select the radio button next to the correct answer.</p>
                </div>

                {qError && <p className="text-red-400 text-xs">{qError}</p>}

                <div className="flex items-center gap-3">
                  <button
                    id="add-question-btn"
                    type="submit"
                    disabled={qAdding}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-semibold rounded-xl text-sm transition-all"
                  >
                    {qAdding ? 'Adding…' : '+ Add Question'}
                  </button>

                  {questions.length > 0 && (
                    <button
                      id="done-quiz-btn"
                      type="button"
                      onClick={() => router.push('/instructor')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all"
                    >
                      ✓ Done — View Instructor Portal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
