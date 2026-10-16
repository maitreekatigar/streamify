import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Check, Flame, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { completeLanguagePractice, getLearningStreak } from "../lib/api";

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const week = () => {
  const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay()+6)%7));
  return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return {key:dateKey(d),label:d.toLocaleDateString("en",{weekday:"short"}),today:dateKey(d)===dateKey(now)};});
};
export default function LearningStreak() {
 const qc=useQueryClient();
 const {data:s,isLoading,isError}=useQuery({queryKey:["learningStreak"],queryFn:getLearningStreak});
 const mutation=useMutation({mutationFn:completeLanguagePractice,onSuccess:d=>{qc.setQueryData(["learningStreak"],d);qc.invalidateQueries({queryKey:["leaderboard"]});toast.success(d.message||"Practice recorded!");},onError:e=>toast.error(e.response?.data?.message||"Couldn't record practice")});
 if(isLoading)return <div className="card bg-base-200 p-6"><span className="loading loading-spinner"/></div>;
 if(isError||!s)return <div className="alert">Couldn't load your streak. Refresh the page.</div>;
 const days=week(),dates=s.practiceDates||[],done=s.lastPracticeDate===dateKey(new Date());
 return <section className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body gap-5 p-5 sm:p-7">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm opacity-70">YOUR LANGUAGE JOURNEY</p><h2 className="mt-1 text-2xl font-bold">Learning Streak</h2><p className="mt-1 text-sm opacity-70">Small practice sessions. Big progress.</p></div><div className="flex items-center gap-2 rounded-2xl bg-orange-100 px-4 py-3 text-orange-700"><Flame className="size-8"/><div><p className="text-3xl font-extrabold">{s.currentStreak}</p><p className="text-xs">day streak</p></div></div></div>
 <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-base-200 p-4"><div className="flex items-center gap-2 text-sm opacity-70"><Trophy className="size-4"/>Longest streak</div><p className="mt-2 text-2xl font-bold">{s.longestStreak} days</p></div><div className="rounded-xl bg-base-200 p-4"><div className="flex items-center gap-2 text-sm opacity-70"><CalendarCheck className="size-4"/>This week</div><p className="mt-2 text-2xl font-bold">{days.filter(d=>dates.includes(d.key)).length} / 7 days</p></div></div>
 <div><h3 className="mb-4 font-semibold">Your weekly activity</h3><div className="grid grid-cols-7 gap-2">{days.map(d=>{const complete=dates.includes(d.key);return <div key={d.key} className="flex flex-col items-center gap-2"><span className="text-xs opacity-70">{d.label}</span><div className={`flex size-9 items-center justify-center rounded-full border-2 ${complete?"border-orange-500 bg-orange-500 text-white":d.today?"border-primary":"border-base-300"}`}>{complete?<Check className="size-4"/>:<span className="text-xs">{d.key.slice(-2)}</span>}</div></div>})}</div></div>
 <div><h3 className="mb-3 font-semibold">Streak milestones</h3><div className="flex flex-wrap gap-2">{[3,7,14,30].map(n=><span key={n} className={`badge gap-1 p-3 ${s.longestStreak>=n?"badge-warning":"badge-ghost"}`}><Trophy className="size-3"/>{n}-day {s.longestStreak>=n?"unlocked":"goal"}</span>)}</div></div>
 <button className="btn btn-primary w-full" onClick={()=>mutation.mutate()} disabled={done||mutation.isPending}>{mutation.isPending?"Recording practice...":done?"✓ Today's practice completed":"🔥 I practised today"}</button>
 <p className="text-center text-xs opacity-60">Record a completed language-practice session once per day.</p>
 </div></section>;
}
