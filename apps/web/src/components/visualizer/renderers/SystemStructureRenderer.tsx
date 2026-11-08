import React from 'react';
import { SystemVisualPayload } from '../core/types';
import { ArrowRight, ArrowLeftRight, Database, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface SystemStructureRendererProps {
  payload: SystemVisualPayload;
}

export function SystemStructureRenderer({ payload }: SystemStructureRendererProps) {
  if (payload.structureType === 'LRU_CACHE') {
    return <LRUCacheVisualizer payload={payload} />;
  }
  return <TokenBucketVisualizer payload={payload} />;
}

/* ========================================================================= */
/* 1. LRU CACHE VISUALIZER (HASH MAP + DOUBLY LINKED LIST)                   */
/* ========================================================================= */
function LRUCacheVisualizer({ payload }: { payload: SystemVisualPayload }) {
  const { capacity = 3, hashTable = {}, linkedList = [], lastAction } = payload;

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[260px] w-full select-none overflow-x-auto space-y-4">
      {/* Action Banner */}
      {lastAction && (
        <div
          className={`flex items-center gap-2 p-2 px-4 rounded-xl text-xs font-mono font-bold animate-in fade-in ${
            lastAction.type === 'EVICT'
              ? 'bg-[#ffebe9] dark:bg-[#f851491a] text-[#cf222e] dark:text-[#f85149] border border-[#f85149]/40'
              : lastAction.hit
              ? 'bg-[#dafbe1] dark:bg-[#2ea0431a] text-[#1a7f37] dark:text-[#3fb950] border border-[#2ea043]/40'
              : 'bg-[#ddf4ff] dark:bg-[#388bfd1a] text-[#0969da] dark:text-[#58a6ff] border border-[#0969da]/40'
          }`}
        >
          <span>Action: {lastAction.type} (Key: "{lastAction.key}")</span>
          {lastAction.hit !== undefined && (
            <span>➔ {lastAction.hit ? 'CACHE HIT (Promote to MRU)' : 'CACHE MISS (Load & Insert)'}</span>
          )}
          {lastAction.type === 'EVICT' && <span>➔ CAPACITY EXCEEDED (Evict LRU Tail)</span>}
        </div>
      )}

      {/* Top: Fast Hash Map (O(1) Direct Pointers) */}
      <div className="w-full max-w-lg p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5 text-[#1f2328] dark:text-[#f0f6fc]">
            <Database className="w-3.5 h-3.5 text-[#0969da]" />
            Hash Map Key Index (O(1) Lookup)
          </span>
          <span className="font-mono text-[11px] text-[#57606a] dark:text-[#8b949e]">
            Size: {Object.keys(hashTable).length} / Capacity: {capacity}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(hashTable).length === 0 ? (
            <span className="text-xs text-[#8c959f] dark:text-[#6e7681] italic">Hash map empty</span>
          ) : (
            Object.entries(hashTable).map(([key, val]) => (
              <div
                key={key}
                className="px-2.5 py-1 rounded-md bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono flex items-center gap-1.5"
              >
                <span className="font-bold text-[#0969da] dark:text-[#58a6ff]">"{key}"</span>
                <span className="text-[#8c959f]">➔</span>
                <span className="text-[#1f2328] dark:text-[#e6edf3]">Node({val})</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom: Doubly Linked List (Head/MRU <-> Tail/LRU) */}
      <div className="w-full max-w-lg p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5 text-[#1f2328] dark:text-[#f0f6fc]">
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#8250df]" />
            Doubly Linked List (Ordering Recency)
          </span>
          <span className="font-mono text-[11px] text-[#8250df] dark:text-[#a371f7]">
            MRU ➔ LRU
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-2">
          {linkedList.length === 0 ? (
            <span className="text-xs text-[#8c959f] dark:text-[#6e7681] italic">List empty</span>
          ) : (
            linkedList.map((node, idx) => {
              const isMRU = node.isMRU || idx === 0;
              const isLRU = node.isLRU || idx === linkedList.length - 1;

              return (
                <React.Fragment key={node.key}>
                  <div
                    className={`shrink-0 p-2.5 rounded-lg border font-mono text-xs flex flex-col items-center justify-center transition-all duration-300 relative ${
                      isMRU
                        ? 'bg-[#dafbe1] dark:bg-[#2ea04326] border-[#1a7f37] dark:border-[#3fb950] text-[#1a7f37] dark:text-[#3fb950] shadow-sm'
                        : isLRU
                        ? 'bg-[#ffebe9] dark:bg-[#f8514926] border-[#cf222e] dark:border-[#f85149] text-[#cf222e] dark:text-[#f85149]'
                        : 'bg-[#f6f8fa] dark:bg-[#161b22] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                      {isMRU ? 'HEAD (MRU)' : isLRU ? 'TAIL (LRU)' : 'NODE'}
                    </span>
                    <span className="font-bold text-sm mt-0.5">
                      {node.key}: {node.value}
                    </span>
                  </div>

                  {idx < linkedList.length - 1 && (
                    <ArrowLeftRight className="w-4 h-4 text-[#8c959f] shrink-0" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 2. TOKEN BUCKET RATE LIMITER VISUALIZER                                   */
/* ========================================================================= */
function TokenBucketVisualizer({ payload }: { payload: SystemVisualPayload }) {
  const { bucket } = payload;
  if (!bucket) return null;

  const { currentTokens, maxCapacity, refillRate, requestStatus } = bucket;
  const fillPercentage = Math.min(100, Math.round((currentTokens / maxCapacity) * 100));

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[260px] w-full select-none overflow-x-auto space-y-4">
      {/* Request Decision Badge */}
      {requestStatus && (
        <div
          className={`flex items-center gap-2 p-2 px-4 rounded-xl text-xs font-mono font-bold animate-in fade-in ${
            requestStatus === 'ALLOWED'
              ? 'bg-[#dafbe1] dark:bg-[#2ea0431a] text-[#1a7f37] dark:text-[#3fb950] border border-[#2ea043]/40'
              : 'bg-[#ffebe9] dark:bg-[#f851491a] text-[#cf222e] dark:text-[#f85149] border border-[#f85149]/40'
          }`}
        >
          {requestStatus === 'ALLOWED' ? (
            <ShieldCheck className="w-4 h-4 text-[#2ea043]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-[#cf222e]" />
          )}
          <span>
            Incoming API Request ➔{' '}
            {requestStatus === 'ALLOWED' ? 'HTTP 200 OK (Token Consumed)' : 'HTTP 429 TOO MANY REQUESTS (Rate Limited)'}
          </span>
        </div>
      )}

      {/* Visual Token Bucket (Cylinder Graphic) */}
      <div className="flex items-center gap-6">
        <div className="relative w-36 h-48 rounded-2xl border-4 border-[#0969da] dark:border-[#58a6ff] bg-[#f6f8fa] dark:bg-[#0d1117] overflow-hidden shadow-md flex flex-col justify-end p-2">
          {/* Liquid Fill */}
          <div
            style={{ height: `${fillPercentage}%` }}
            className="w-full bg-gradient-to-t from-[#0969da] to-[#58a6ff] rounded-b-lg transition-all duration-500 relative flex items-center justify-center text-white font-mono font-bold text-xs"
          >
            {currentTokens > 0 && <span>{currentTokens} / {maxCapacity}</span>}
          </div>

          {/* Empty State indicator */}
          {currentTokens === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-[#cf222e]">
              EMPTY (429)
            </div>
          )}
        </div>

        {/* Bucket Specs Card */}
        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
            <span className="text-[#57606a] dark:text-[#8b949e] block text-[10px]">CURRENT TOKENS</span>
            <span className="text-base font-bold text-[#0969da] dark:text-[#58a6ff]">
              {currentTokens} tokens
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
            <span className="text-[#57606a] dark:text-[#8b949e] block text-[10px]">MAX CAPACITY</span>
            <span className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              {maxCapacity} tokens
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
            <span className="text-[#57606a] dark:text-[#8b949e] block text-[10px]">REFILL RATE</span>
            <span className="text-base font-bold text-[#1a7f37] dark:text-[#3fb950]">
              +{refillRate} / sec
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
