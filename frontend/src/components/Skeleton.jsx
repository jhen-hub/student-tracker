// Reusable skeleton primitives. Place this file in src/components/.

export function Skeleton({ className = '', style }) {
  const rounding = className.includes('rounded') ? '' : 'rounded'
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`animate-pulse bg-gray-200 motion-reduce:animate-none ${rounding} ${className}`}
    />
  )
}

// ---- Stat card ----
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex justify-between">
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  )
}

// ---- Greeting Card (Student Dashboard welcome banner) ----
export function GreetingCardSkeleton() {
  return (
    <div className="flex flex-col mb-6 rounded-2xl bg-navy-900 p-6 shadow-card">  
      <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
      <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
      <Skeleton className="h-4 w-64 bg-white/10" />
    </div>
  )
}

// ---- Bar chart (Recharts <BarChart>) ----
const BAR_HEIGHTS = [0.55, 0.8, 0.4, 0.9, 0.65, 0.75]

export function BarChartSkeleton({ height = 280 }) {
  const plotHeight = height - 40 // leaves room for the legend row
  
  return (
    <div role="status" aria-busy="true" className="flex flex-col relative" style={{ height }}>
      <span className="sr-only">Loading chart…</span>
      
      {/* Added flex-1 and inline alignItems: 'flex-end' to force bars to the bottom */}
      <div 
        className="flex flex-1 justify-between gap-4 border-b border-l border-gray-200 px-4" 
        style={{ alignItems: 'flex-end' }}
      >
        {BAR_HEIGHTS.map((h, i) => (
          <Skeleton
            key={i}
            className="w-full max-w-[60px] rounded-b-none rounded-t-md"
            style={{ height: Math.round(plotHeight * h) }}
          />
        ))}
      </div>
      
      <div className="mt-3 flex justify-center gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// ---- Donut chart (Recharts <PieChart> with innerRadius) ----
export function DonutSkeleton({ height = 280, size = 170, thickness = 30 }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-4"
      style={{ height }}
    >
      <span className="sr-only">Loading chart…</span>
      <div
        aria-hidden="true"
        className="animate-pulse rounded-full border-gray-200 motion-reduce:animate-none"
        style={{ width: size, height: size, borderWidth: thickness, borderStyle: 'solid' }}
      />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}

// ---- List (activity feed / notifications) ----
// Switched from classes (w-1/3) to inline percentages so it works even if missing CSS
const TITLE_WIDTHS = ['40%', '33%', '50%', '40%', '33%', '50%']
const TEXT_WIDTHS = ['60%', '66%', '50%', '60%', '66%', '50%']

export function ListSkeleton({ rows = 5, trailing = false, divided = true }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <ul className={divided ? 'divide-y divide-ink-300/60' : 'space-y-3'}>
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className={`flex items-center justify-between ${divided ? 'py-2.5' : ''}`}>
            <div className="w-full space-y-2">
              <Skeleton style={{ height: '14px', width: TITLE_WIDTHS[i % TITLE_WIDTHS.length] }} />
              <Skeleton style={{ height: '12px', width: TEXT_WIDTHS[i % TEXT_WIDTHS.length] }} />
            </div>
            {trailing && <Skeleton className="ml-4 h-3 w-16 shrink-0" />}
          </li>
        ))}
      </ul>
    </div>
  )
}