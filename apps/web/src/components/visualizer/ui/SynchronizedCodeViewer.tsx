import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, Check, Code2, Sparkles } from 'lucide-react';
import { SupportedLanguage } from '../core/types';

interface SynchronizedCodeViewerProps {
  codeMap: Record<SupportedLanguage, string>;
  activeLine?: number;
  variables?: Record<string, any>;
  defaultLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  maxHeight?: string;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  java: 'Java'
};

const KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'while', 'for', 'in', 'and', 'or', 'not',
  'from', 'import', 'as', 'pass', 'break', 'continue', 'lambda', 'with', 'yield',
  'function', 'const', 'let', 'var', 'new', 'true', 'false', 'null', 'undefined',
  'async', 'await', 'export', 'default', 'typeof', 'instanceof',
  'int', 'void', 'bool', 'boolean', 'char', 'double', 'float', 'long', 'public',
  'private', 'protected', 'class', 'static', 'final', 'struct', 'namespace',
  'template', 'typename', 'static_cast', 'reinterpret_cast', 'using'
]);

const BUILTINS = new Set([
  'len', 'range', 'enumerate', 'min', 'max', 'sum', 'abs', 'print', 'sorted',
  'Math', 'floor', 'ceil', 'push', 'pop', 'slice', 'concat', 'indexOf', 'has', 'get', 'set',
  'vector', 'string', 'unordered_map', 'unordered_set', 'pair', 'size_t', 'cout', 'cin', 'endl',
  'Map', 'HashMap', 'Set', 'HashSet', 'List', 'ArrayList', 'Arrays', 'System', 'out', 'println'
]);

function tokenize(line: string) {
  const tokenRegex = /(\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*\b|\s+|[^\s\w])/g;
  const tokens: { text: string; type: 'space' | 'comment' | 'string' | 'keyword' | 'builtin' | 'func' | 'number' | 'punct' | 'ident' }[] = [];
  let m: RegExpExecArray | null;

  while ((m = tokenRegex.exec(line)) !== null) {
    const raw = m[0];
    if (/^\s+$/.test(raw)) {
      tokens.push({ text: raw, type: 'space' });
    } else if (raw.startsWith('//') || raw.startsWith('#')) {
      tokens.push({ text: raw, type: 'comment' });
    } else if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      tokens.push({ text: raw, type: 'string' });
    } else if (/^\d+(?:\.\d+)?$/.test(raw)) {
      tokens.push({ text: raw, type: 'number' });
    } else if (KEYWORDS.has(raw)) {
      tokens.push({ text: raw, type: 'keyword' });
    } else if (BUILTINS.has(raw)) {
      tokens.push({ text: raw, type: 'builtin' });
    } else {
      tokens.push({ text: raw, type: 'ident' });
    }
  }

  return tokens;
}

export function SynchronizedCodeViewer({
  codeMap,
  activeLine,
  variables = {},
  defaultLanguage = 'python',
  onLanguageChange,
  maxHeight = '380px'
}: SynchronizedCodeViewerProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(defaultLanguage);
  const [copied, setCopied] = useState<boolean>(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleLangSelect = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    onLanguageChange?.(lang);
  };

  const rawCode = useMemo(() => {
    return codeMap[selectedLang] || '// Implementation not available for this language.';
  }, [codeMap, selectedLang]);

  const lines = useMemo(() => {
    return rawCode.split('\n');
  }, [rawCode]);

  // Smooth auto-scroll active line into center of viewer
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeLine, selectedLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format variables for ghost badge display
  const inlineVariableStr = useMemo(() => {
    if (!variables || Object.keys(variables).length === 0) return null;
    const entries = Object.entries(variables)
      .filter(([k]) => !k.startsWith('_'))
      .slice(0, 4)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`);
    return entries.join(' · ');
  }, [variables]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-xs">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Code2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] mr-1 shrink-0" />
          {(Object.keys(codeMap) as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangSelect(lang)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedLang === lang
                  ? 'bg-white dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] shadow-2xs border border-[#d0d7de] dark:border-[#30363d]'
                  : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
            >
              {LANGUAGE_LABELS[lang] || lang}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#21262d] transition cursor-pointer shrink-0"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Lines with Synchronized Highlighting */}
      <div
        ref={containerRef}
        style={{ maxHeight }}
        className="flex-1 overflow-y-auto overflow-x-auto p-2 font-mono text-xs leading-relaxed bg-[#ffffff] dark:bg-[#0d1117]"
      >
        {lines.map((lineText, idx) => {
          const lineNumber = idx + 1;
          const isCurrentActive = activeLine === lineNumber;
          const tokens = tokenize(lineText);

          return (
            <div
              key={lineNumber}
              ref={isCurrentActive ? activeLineRef : null}
              className={`group flex items-center min-w-full rounded px-2 py-0.5 transition-colors duration-150 relative ${
                isCurrentActive
                  ? 'bg-[#ddf4ff] dark:bg-[#388bfd26] border-l-4 border-[#0969da] dark:border-[#58a6ff] font-semibold'
                  : 'hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]'
              }`}
            >
              {/* Line Number */}
              <span
                className={`w-7 shrink-0 text-right pr-3 select-none text-[11px] font-mono ${
                  isCurrentActive
                    ? 'text-[#0969da] dark:text-[#58a6ff] font-bold'
                    : 'text-[#8c959f] dark:text-[#484f58]'
                }`}
              >
                {lineNumber}
              </span>

              {/* Code Tokens */}
              <div className="flex-1 whitespace-pre pr-2">
                {tokens.map((tok, tIdx) => {
                  let colorClass = 'text-[#24292f] dark:text-[#c9d1d9]';
                  if (tok.type === 'keyword') colorClass = 'text-[#cf222e] dark:text-[#ff7b72] font-semibold';
                  else if (tok.type === 'builtin') colorClass = 'text-[#953800] dark:text-[#ffa657]';
                  else if (tok.type === 'string') colorClass = 'text-[#0a3069] dark:text-[#a5d6ff]';
                  else if (tok.type === 'number') colorClass = 'text-[#0550ae] dark:text-[#79c0ff]';
                  else if (tok.type === 'comment') colorClass = 'text-[#6e7781] dark:text-[#8b949e] italic';
                  else if (tok.type === 'func') colorClass = 'text-[#8250df] dark:text-[#d2a8ff] font-bold';

                  return (
                    <span key={tIdx} className={colorClass}>
                      {tok.text}
                    </span>
                  );
                })}
              </div>

              {/* Inline Ghost Variable Badges on Active Line */}
              {isCurrentActive && inlineVariableStr && (
                <div className="shrink-0 ml-auto hidden sm:flex items-center gap-1 px-2 py-0.2 rounded-full bg-[#0969da1a] dark:bg-[#388bfd33] border border-[#0969da33] dark:border-[#58a6ff40] text-[10px] text-[#0969da] dark:text-[#58a6ff] font-mono font-medium shadow-2xs animate-in fade-in duration-200">
                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                  <span>{inlineVariableStr}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
