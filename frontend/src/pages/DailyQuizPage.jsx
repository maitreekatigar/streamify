import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Star, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { getDailyQuiz, submitDailyQuiz } from "../lib/api";

export default function DailyQuizPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["dailyQuiz"], queryFn: getDailyQuiz });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const mutation = useMutation({
    mutationFn: submitDailyQuiz,
    onSuccess: (payload) => { setResult(payload); qc.invalidateQueries({ queryKey: ["charmBalance"] }); toast.success(payload.message); },
    onError: (error) => toast.error(error.response?.data?.message || "Couldn't submit quiz"),
  });
  if (isLoading) return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg" /></div>;
  if (isError || !data) return <div className="p-8">Could not load today's quiz. Please refresh.</div>;
  const completed = result || data.completed;
  return <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
    <header><p className="text-sm opacity-60">A LITTLE PRACTICE EVERY DAY</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-bold"><Star className="text-warning fill-warning"/> Daily Language Quiz</h1><p className="mt-2 opacity-70">Five questions. Earn one star charm for every correct answer.</p></header>
    <div className="flex items-center gap-3 rounded-2xl bg-warning/10 p-4"><Trophy className="text-warning"/><div><b>Today's challenge</b><p className="text-sm opacity-70">Answer all five questions to earn your charms.</p></div></div>
    {data.questions.map((q, i) => <section key={q.id} className="card border border-base-300 bg-base-100"><div className="card-body"><p className="text-sm opacity-60">QUESTION {i+1} OF 5</p><h2 className="text-lg font-semibold">{q.question}</h2><div className="mt-2 grid gap-2">{q.options.map((option, j) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${answers[q.id] === j ? "border-primary bg-primary/10" : "border-base-300"}`}><input type="radio" className="radio radio-primary radio-sm" name={`question-${q.id}`} checked={answers[q.id] === j} disabled={Boolean(result)} onChange={() => setAnswers((old) => ({...old, [q.id]: j}))}/>{option}{result && <span className="ml-auto text-xs">{result.results[i]?.correct ? "✓ Correct" : result.results[i]?.correctAnswer === j ? "Correct answer" : ""}</span>}</label>)}</div>{result && <p className="mt-2 text-sm opacity-70">{result.results[i]?.explanation}</p>}</div></section>)}
    {result ? <section className="card bg-success/10"><div className="card-body"><h2 className="flex items-center gap-2 text-xl font-bold"><CheckCircle2/>{result.correct}/{result.total} correct</h2><p>You earned <b>{result.charmsEarned} star charms</b>! Your total is {result.charms} charms.</p><p className="text-sm opacity-70">Come back tomorrow for a new daily challenge.</p></div></section> : <button className="btn btn-primary w-full" disabled={Object.keys(answers).length !== 5 || mutation.isPending} onClick={() => mutation.mutate(data.questions.map((q) => answers[q.id]))}>{mutation.isPending ? "Checking answers…" : "Submit answers and earn charms"}</button>}
  </main>;
}
