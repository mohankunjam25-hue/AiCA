import React, { useState, useMemo } from 'react';
import { Check, Copy, Code2, Terminal, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export type SupportedCodeLanguage = 'python' | 'javascript' | 'cpp' | 'java';

interface AlgorithmCodeViewerProps {
  codeMap: Partial<Record<SupportedCodeLanguage, string>>;
  algorithmName: string;
  defaultLanguage?: SupportedCodeLanguage;
}

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

function tokenizeLine(line: string, nextTokens: string[]) {
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

  // Refine function names if immediately followed by '('
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type === 'ident') {
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === 'space') j++;
      if (j < tokens.length && tokens[j].text === '(') {
        tokens[i].type = 'func';
      }
    }
  }

  return tokens;
}

export function AlgorithmCodeViewer({
  codeMap,
  algorithmName,
  defaultLanguage = 'python'
}: AlgorithmCodeViewerProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedCodeLanguage>(defaultLanguage);
  const [copied, setCopied] = useState(false);

  const activeCode = useMemo(() => {
    return codeMap[selectedLang] || '// No code implementation provided for this language.';
  }, [codeMap, selectedLang]);

  const lines = useMemo(() => {
    return activeCode.split('\n');
  }, [activeCode]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  const getLanguageLabel = (lang: SupportedCodeLanguage) => {
    switch (lang) {
      case 'python':
        return 'Python 3';
      case 'javascript':
        return 'JavaScript';
      case 'cpp':
        return 'C++ 20';
      case 'java':
        return 'Java 17';
    }
  };

  return (
    <div className="rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] shadow-sm overflow-hidden transition-colors duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        {/* Language Tabs */}
        <div className="flex items-center gap-1.5" role="tablist">
          {(['python', 'javascript', 'cpp', 'java'] as const).map((lang) => (
            <button
              key={lang}
              role="tab"
              aria-selected={selectedLang === lang}
              onClick={() => {
                setSelectedLang(lang);
                setCopied(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                selectedLang === lang
                  ? 'bg-white dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs font-bold'
                  : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              {getLanguageLabel(lang)}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#656d76] dark:text-[#848d97] hidden sm:inline">
            {lines.length} lines • {getLanguageLabel(selectedLang)}
          </span>

          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                <span className="text-[#1a7f37] dark:text-[#3fb950] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#656d76] dark:text-[#848d97]" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Syntax-Colored Code Stage with Line Numbers */}
      <div className="relative overflow-x-auto text-xs font-mono leading-relaxed select-text py-3">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const tokens = tokenizeLine(line, []);
              return (
                <tr
                  key={idx}
                  className="hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]/70 transition-colors group"
                >
                  {/* Gutter / Line Number */}
                  <td className="w-12 py-0.5 px-3 select-none text-right font-mono text-[11px] text-[#8c959f] dark:text-[#6e7681] border-r border-[#d0d7de]/70 dark:border-[#30363d] group-hover:text-[#1f2328] dark:group-hover:text-[#f0f6fc]">
                    {idx + 1}
                  </td>

                  {/* Code Line Content */}
                  <td className="py-0.5 px-4 whitespace-pre font-mono text-xs">
                    {tokens.map((t, tIdx) => {
                      let colorClass = 'text-[#1f2328] dark:text-[#f0f6fc]';
                      if (t.type === 'comment') {
                        colorClass = 'text-[#6e7781] dark:text-[#8b949e] italic';
                      } else if (t.type === 'string') {
                        colorClass = 'text-[#0a3069] dark:text-[#a5d6ff]';
                      } else if (t.type === 'keyword') {
                        colorClass = 'text-[#cf222e] dark:text-[#ff7b72] font-semibold';
                      } else if (t.type === 'builtin') {
                        colorClass = 'text-[#0550ae] dark:text-[#79c0ff]';
                      } else if (t.type === 'func') {
                        colorClass = 'text-[#8250df] dark:text-[#d2a8ff] font-semibold';
                      } else if (t.type === 'number') {
                        colorClass = 'text-[#0969da] dark:text-[#79c0ff]';
                      }
                      return (
                        <span key={tIdx} className={colorClass}>
                          {t.text}
                        </span>
                      );
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border-t border-[#d0d7de] dark:border-[#30363d] text-[11px] text-[#57606a] dark:text-[#8b949e]">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
          <span>Textbook implementation for {algorithmName}</span>
        </div>

        <Link
          to="/problems"
          className="inline-flex items-center gap-1 font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
        >
          <span>Run in Linux Sandbox</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
