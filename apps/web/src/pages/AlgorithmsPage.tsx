import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Workflow, Clock3, Layers3, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useDataCacheStore } from '../store/useDataCacheStore';

export type Algorithm = {
  _id?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: { javascript: string; python: string };
  steps: string[];
};

export function AlgorithmsPage() {
  const cachedAlgorithms = useDataCacheStore.getState().get<Algorithm[]>('algorithms_catalog');
  const [algorithms, setAlgorithms] = useState<Algorithm[]>(cachedAlgorithms || []);
  const [loading, setLoading] = useState(!cachedAlgorithms);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const cached = useDataCacheStore.getState().get<Algorithm[]>('algorithms_catalog');
    if (cached && cached.length > 0) {
      setAlgorithms(cached);
      setLoading(false);
      return;
    }

    api.get('/algorithms')
      .then(({ data }) => {
        if (active) {
          const list = data.data ?? [];
          setAlgorithms(list);
          useDataCacheStore.getState().set('algorithms_catalog', list);
        }
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load algorithms. Check your connection and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(algorithms.map((item) => item.category)))], [algorithms]);
  const filteredAlgorithms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return algorithms.filter((algorithm) => {
      const matchesCategory = category === 'All' || algorithm.category === category;
      const matchesSearch = !query || `${algorithm.name} ${algorithm.category} ${algorithm.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [algorithms, category, search]);

  const generateAlgorithm = async () => {
    const query = search.trim();
    if (!query || generating) return;
    setGenerating(true);
    setGenerationError('');
    try {
      const { data } = await api.post('/algorithms/generate', { query });
      const generated: Algorithm = data.data;
      setAlgorithms((current) => current.some((item) => item.slug === generated.slug) ? current : [generated, ...current]);
      setCategory('All');
      navigate(`/algorithms/${generated.slug}`);
    } catch (err: any) {
      setGenerationError(err.response?.data?.message || 'Could not generate this algorithm. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3"><Workflow className="w-8 h-8 text-purple-500 dark:text-purple-400" />Algorithms Library</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Explore algorithms by topic, review their complexity, and open a guide with code in JavaScript and Python.</p>
      </div>

      <div className="relative"><Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" /><input type="search" placeholder="Search algorithms or topics..." value={search} onChange={(event) => { setSearch(event.target.value); setGenerationError(''); }} onKeyDown={(event) => { if (event.key === 'Enter' && !loading && filteredAlgorithms.length === 0) void generateAlgorithm(); }} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500" /></div>

      {loading ? <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading algorithms...</div> : error ? (
        <div role="alert" className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-sm text-rose-700 dark:text-rose-300">{error}<button onClick={() => window.location.reload()} className="ml-3 underline font-semibold">Retry</button></div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold ${category === item ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>{item}</button>)}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>{filteredAlgorithms.length} algorithms</span><span>Complexity may vary by implementation.</span></div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(120px,0.8fr)_minmax(100px,0.7fr)_24px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-900 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800"><span>Algorithm</span><span>What it does</span><span>Time</span><span>Space</span><span /></div>
            {filteredAlgorithms.length ? filteredAlgorithms.map((algorithm) => (
              <Link to={`/algorithms/${algorithm.slug}`} key={algorithm.slug} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(120px,0.8fr)_minmax(100px,0.7fr)_24px] gap-2 md:gap-4 px-5 py-4 border-t border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                <div><h2 className="font-semibold text-sm text-slate-900 dark:text-slate-200">{algorithm.name}</h2><span className="inline-flex items-center gap-1 mt-1 text-[11px] text-indigo-600 dark:text-indigo-300"><Layers3 className="w-3 h-3" />{algorithm.category}</span></div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{algorithm.description}</p>
                <div className="text-xs text-slate-700 dark:text-slate-300"><Clock3 className="w-3.5 h-3.5 inline mr-1.5 text-emerald-500" /><span className="md:hidden">Time: </span><code>{algorithm.timeComplexity}</code></div>
                <div className="text-xs text-slate-700 dark:text-slate-300"><span className="md:hidden">Space: </span><code>{algorithm.spaceComplexity}</code></div><ArrowRight className="hidden md:block w-4 h-4 text-slate-400 self-center" />
              </Link>
            )) : <div className="p-8 text-center space-y-3"><p className="text-sm text-slate-500 dark:text-slate-400">{search.trim() ? `No match for “${search.trim()}”.` : algorithms.length ? 'No algorithms in this category.' : 'No algorithms are in the database yet.'}</p>{search.trim() && <><p className="text-xs text-slate-500 dark:text-slate-400">Generate a guide with JavaScript and Python code, complexity, and step-by-step explanation, then save it to this library.</p><button onClick={() => void generateAlgorithm()} disabled={generating} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold">{generating ? 'Generating and saving…' : `Generate “${search.trim()}” with AI and add to library`}</button>{generationError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{generationError}</p>}</>}</div>}
          </div>
        </>
      )}
    </div>
  );
}
