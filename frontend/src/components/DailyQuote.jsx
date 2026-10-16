import { BookOpen, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

// Local quotes make this card work even when an external quote API is unavailable.
// Quotes are short public-domain sayings / literary lines; translations are provided for learning.
const quotes = {
  en: [
    { quote: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { quote: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
    { quote: "The world is full of magical things patiently waiting for our wits to grow sharper.", author: "Bertrand Russell" },
    { quote: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson" },
    { quote: "A thing of beauty is a joy for ever.", author: "John Keats" },
    { quote: "We read to know we are not alone.", author: "Often attributed to C. S. Lewis" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain (attribution disputed)" },
  ],
  it: [
    { quote: "Conoscere se stessi è l'inizio di ogni saggezza.", author: "Aristotele · traduzione italiana" },
    { quote: "Non c'è agonia più grande che portare dentro di sé una storia mai raccontata.", author: "Maya Angelou · traduzione italiana" },
    { quote: "Il mondo è pieno di cose magiche che aspettano pazientemente che il nostro ingegno diventi più acuto.", author: "Bertrand Russell · traduzione italiana" },
    { quote: "La speranza è quella cosa piumata che si posa sull'anima.", author: "Emily Dickinson · traduzione italiana" },
    { quote: "Una cosa bella è una gioia per sempre.", author: "John Keats · traduzione italiana" },
    { quote: "Leggiamo per sapere di non essere soli.", author: "Spesso attribuita a C. S. Lewis · traduzione italiana" },
    { quote: "Il segreto per andare avanti è iniziare.", author: "Attribuzione a Mark Twain discussa · traduzione italiana" },
  ],
  es: [
    { quote: "Conocerse a uno mismo es el comienzo de toda sabiduría.", author: "Aristóteles · traducción al español" },
    { quote: "No hay mayor agonía que llevar dentro una historia sin contar.", author: "Maya Angelou · traducción al español" },
    { quote: "El mundo está lleno de cosas mágicas que esperan pacientemente a que nuestro ingenio se agudice.", author: "Bertrand Russell · traducción al español" },
    { quote: "La esperanza es esa cosa con plumas que se posa en el alma.", author: "Emily Dickinson · traducción al español" },
    { quote: "Una cosa bella es una alegría para siempre.", author: "John Keats · traducción al español" },
    { quote: "Leemos para saber que no estamos solos.", author: "A menudo atribuida a C. S. Lewis · traducción al español" },
    { quote: "El secreto para avanzar es empezar.", author: "Atribución a Mark Twain discutida · traducción al español" },
  ],
};

const languages = [
  { code: "en", name: "English" },
  { code: "it", name: "Italian" },
  { code: "es", name: "Spanish" },
];

function getDailyIndex(length) {
  const now = new Date();
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return dayNumber % length;
}

export default function DailyQuote() {
  const [language, setLanguage] = useState("en");
  const [refresh, setRefresh] = useState(0);
  const quote = useMemo(() => {
    const list = quotes[language] || quotes.en;
    return list[(getDailyIndex(list.length) + refresh) % list.length];
  }, [language, refresh]);

  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary" />
            <h2 className="text-xl font-bold">Quote of the day</h2>
          </div>
          <div className="flex gap-2">
            <select className="select select-bordered select-sm" value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Quote language">
              {languages.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => setRefresh((value) => value + 1)} aria-label="Get another quote">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        <blockquote className="text-lg italic leading-relaxed">“{quote.quote}”</blockquote>
        <p className="text-sm opacity-70">— {quote.author}</p>
        <p className="text-xs opacity-60">A daily reading prompt for language learners. Translations are for learning and may differ from published editions.</p>
      </div>
    </section>
  );
}
