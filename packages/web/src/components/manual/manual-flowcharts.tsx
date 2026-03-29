import { cn } from '@/lib/utils';

const panel =
  'rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8';

const e2eSteps = [
  'Patient arrives',
  'Register or look up patient',
  'Create order & select tests',
  'Invoice generated',
  'Collect → receive sample',
  'Enter results',
  'Review & authorise',
  'PDF report generated',
  'Share / print / download',
] as const;

function TextOnlyDiagram({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50/40 open:border-slate-200 open:bg-white/80">
      <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-medium text-violet-800 outline-none transition-colors hover:bg-violet-50/50 [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <div className="border-t border-slate-100 px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

/** End-to-end lab workflow — patient visit through delivery */
export function EndToEndFlowchart({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        panel,
        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100',
        className,
      )}
    >
      <figcaption className="mb-6 text-sm font-semibold text-slate-900">Patient visit → report delivery</figcaption>
      <svg
        viewBox="0 0 320 620"
        className="mx-auto h-auto w-full max-w-[18rem] sm:max-w-[20rem] lg:max-w-[24rem] print:max-w-[16rem]"
        role="img"
        aria-labelledby="flow-e2e-title"
      >
        <title id="flow-e2e-title">Workflow from patient arrival to report delivery</title>
        <defs>
          <linearGradient id="e2e-node" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(237 233 254)" />
            <stop offset="100%" stopColor="rgb(204 251 241)" />
          </linearGradient>
        </defs>
        {e2eSteps.map((label, i) => {
          const y = 16 + i * 64;
          const h = 44;
          const nextTop = i < e2eSteps.length - 1 ? 16 + (i + 1) * 64 : null;
          return (
            <g key={label}>
              <rect
                x="40"
                y={y}
                width="240"
                height={h}
                rx="12"
                fill="url(#e2e-node)"
                stroke="rgba(124,58,237,0.22)"
                strokeWidth="1"
              />
              <text
                x="160"
                y={y + h / 2 + 5}
                textAnchor="middle"
                className="fill-slate-800 text-[11px] font-medium"
                style={{ fontFamily: 'inherit' }}
              >
                {label.length > 34 ? `${label.slice(0, 32)}…` : label}
              </text>
              {nextTop !== null && (
                <>
                  <line
                    x1="160"
                    y1={y + h + 1}
                    x2="160"
                    y2={nextTop - 6}
                    stroke="rgb(124 58 237)"
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`157,${nextTop - 8} 160,${nextTop - 2} 163,${nextTop - 8}`}
                    fill="rgb(13 148 136)"
                    fillOpacity="0.55"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
      <TextOnlyDiagram label="Text-only version of this flow (same steps)">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
          {e2eSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </TextOnlyDiagram>
    </figure>
  );
}

/** Sample status progression with rejection branch */
export function SampleLifecycleFlowchart({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        panel,
        'overflow-x-auto motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:delay-75 motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:delay-0',
        className,
      )}
    >
      <figcaption className="mb-5 text-sm font-semibold text-slate-900">Sample lifecycle</figcaption>
      <svg
        viewBox="0 0 520 200"
        className="mx-auto hidden h-auto w-full min-w-[480px] max-w-full sm:block print:block"
        role="img"
        aria-labelledby="flow-sample-title"
      >
        <title id="flow-sample-title">
          Sample statuses from ordered through completed, with optional rejection branch
        </title>
        <defs>
          <linearGradient id="s-node" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(224 231 255)" />
            <stop offset="100%" stopColor="rgb(207 250 254)" />
          </linearGradient>
        </defs>
        {[
          { x: 8, label: 'Ordered' },
          { x: 98, label: 'Collected' },
          { x: 198, label: 'Received' },
          { x: 298, label: 'In process' },
          { x: 398, label: 'Completed' },
        ].map((node, i, arr) => (
          <g key={node.label}>
            <rect
              x={node.x}
              y="56"
              width="78"
              height="36"
              rx="8"
              fill="url(#s-node)"
              stroke="rgba(15,23,42,0.12)"
              strokeWidth="1"
            />
            <text
              x={node.x + 39}
              y="78"
              textAnchor="middle"
              className="fill-slate-800 text-[9px] font-semibold"
              style={{ fontFamily: 'inherit' }}
            >
              {node.label}
            </text>
            {i < arr.length - 1 && (
              <>
                <line
                  x1={node.x + 78}
                  y1="74"
                  x2={arr[i + 1].x - 4}
                  y2="74"
                  stroke="rgb(124 58 237)"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                />
                <polygon
                  points={`${arr[i + 1].x - 6},71 ${arr[i + 1].x - 2},74 ${arr[i + 1].x - 6},77`}
                  fill="rgb(124 58 237)"
                  fillOpacity="0.5"
                />
              </>
            )}
          </g>
        ))}
        <path
          d="M 275 92 Q 275 130 360 130 L 398 130"
          fill="none"
          stroke="rgb(239 68 68)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <rect x="400" y="112" width="112" height="36" rx="8" fill="rgb(254 242 242)" stroke="rgb(252 165 165)" strokeWidth="1" />
        <text x="456" y="134" textAnchor="middle" className="fill-red-800 text-[9px] font-semibold" style={{ fontFamily: 'inherit' }}>
          Rejected
        </text>
        <text x="320" y="124" textAnchor="middle" className="fill-red-700/80 text-[8px]" style={{ fontFamily: 'inherit' }}>
          if unsuitable
        </text>
      </svg>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-600 sm:hidden print:hidden" aria-label="Sample status order">
        {['Ordered', 'Collected', 'Received', 'In process', 'Completed'].map((s) => (
          <li key={s} className="pl-1 marker:font-medium marker:text-teal-600">
            <span className="font-medium text-slate-800">{s}</span>
          </li>
        ))}
        <li className="pl-1 text-red-800/90 marker:text-red-400">Rejected — if unsuitable (reason recorded)</li>
      </ol>
    </figure>
  );
}

const resultNodes = ['Pending', 'Entered', 'Reviewed', 'Authorised'] as const;

/** Result path from entry to authorisation */
export function ResultPipelineFlowchart({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        panel,
        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:delay-100 motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:delay-0',
        className,
      )}
    >
      <figcaption className="mb-5 text-sm font-semibold text-slate-900">Result pipeline</figcaption>
      <svg
        viewBox="0 0 400 88"
        className="mx-auto hidden h-auto w-full max-w-md sm:block print:block"
        role="img"
        aria-labelledby="flow-res-title"
      >
        <title id="flow-res-title">Result statuses from pending through authorised</title>
        <defs>
          <linearGradient id="r-node" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(245 243 255)" />
            <stop offset="100%" stopColor="rgb(236 253 245)" />
          </linearGradient>
        </defs>
        {resultNodes.map((label, i) => {
          const x = 12 + i * 96;
          return (
            <g key={label}>
              <rect x={x} y="24" width="84" height="40" rx="10" fill="url(#r-node)" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
              <text x={x + 42} y="48" textAnchor="middle" className="fill-slate-800 text-[10px] font-semibold" style={{ fontFamily: 'inherit' }}>
                {label}
              </text>
              {i < resultNodes.length - 1 && (
                <>
                  <line x1={x + 84} y1="44" x2={x + 92} y2="44" stroke="rgb(13 148 136)" strokeOpacity="0.4" strokeWidth="2" />
                  <polygon points={`${x + 90},40 ${x + 96},44 ${x + 90},48`} fill="rgb(13 148 136)" fillOpacity="0.55" />
                </>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:hidden print:hidden" aria-label="Result status order">
        <span className="font-medium text-slate-800">Pending</span>
        <span className="mx-1.5 text-slate-300">→</span>
        <span className="font-medium text-slate-800">Entered</span>
        <span className="mx-1.5 text-slate-300">→</span>
        <span className="font-medium text-slate-800">Reviewed</span>
        <span className="mx-1.5 text-slate-300">→</span>
        <span className="font-medium text-slate-800">Authorised</span>
      </p>
    </figure>
  );
}
