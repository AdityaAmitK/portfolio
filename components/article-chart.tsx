import { Component, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

// Declarative charts for article bodies. Authors write a fenced ```article-chart block
// containing JSON; see docs/article-charts.md for the contract. Anything invalid falls
// back to the plain code block, so a bad spec never breaks the rest of the article.

const MAX_SOURCE = 10_000
const MAX_SERIES = 4
const MAX_POINTS = 60
const MAX_ABS = 1e15

type Format = { locale: string; prefix: string; suffix: string; decimals: number }
type Series = { name: string; values: number[] }
type Common = { title: string; caption?: string; summary?: string; xLabel: string; yLabel?: string; format: Format }
type StaticSpec = Common & { type: 'line' | 'bar'; labels: string[]; series: Series[] }
type Control = { label: string; value: number; min: number; max: number; step: number; prefix: string; suffix: string }
type ProjectionInputs = { initial: Control; perPeriod: Control; ratePercent: Control; years: Control }
type ProjectionSpec = Common & { type: 'projection'; periodsPerYear: number; inputs: ProjectionInputs; seriesLabels: { added: string; projected: string } }
type ChartSpec = StaticSpec | ProjectionSpec

class SpecError extends Error {}

function fail(message: string): never {
  throw new SpecError(message)
}

function record(value: unknown, path: string, allowed: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path} must be an object`)
  const unknown = Object.keys(value).find(key => !allowed.includes(key))
  if (unknown) fail(`unknown field "${path === 'spec' ? '' : `${path}.`}${unknown}"`)
  return value as Record<string, unknown>
}

function text(value: unknown, path: string, max: number, fallback?: string) {
  if (value === undefined && fallback !== undefined) return fallback
  if (typeof value !== 'string' || (fallback === undefined && !value.trim()) || value.length > max) fail(`${path} must be text up to ${max} characters`)
  return value
}

function optionalText(value: unknown, path: string, max: number) {
  return value === undefined ? undefined : text(value, path, max)
}

function num(value: unknown, path: string, min = -MAX_ABS, max = MAX_ABS) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(`${path} must be a finite number between ${min} and ${max}`)
  return value
}

function parseFormat(value: unknown): Format {
  const raw = record(value ?? {}, 'format', ['locale', 'prefix', 'suffix', 'decimals'])
  const locale = text(raw.locale, 'format.locale', 35, 'en-IN')
  try {
    if (!Intl.NumberFormat.supportedLocalesOf(locale).length) fail('format.locale is not supported')
  } catch (error) {
    if (error instanceof SpecError) throw error
    fail('format.locale is not a valid locale')
  }
  const decimals = num(raw.decimals ?? 0, 'format.decimals', 0, 4)
  if (!Number.isInteger(decimals)) fail('format.decimals must be a whole number')
  return { locale, prefix: text(raw.prefix, 'format.prefix', 8, ''), suffix: text(raw.suffix, 'format.suffix', 12, ''), decimals }
}

function parseControl(value: unknown, path: string, bounds: { min: number; max: number; integer?: boolean }): Control {
  const raw = record(value, path, ['label', 'value', 'min', 'max', 'step', 'prefix', 'suffix'])
  const control = {
    label: text(raw.label, `${path}.label`, 60),
    value: num(raw.value, `${path}.value`, bounds.min, bounds.max),
    min: num(raw.min ?? raw.value, `${path}.min`, bounds.min, bounds.max),
    max: num(raw.max ?? raw.value, `${path}.max`, bounds.min, bounds.max),
    step: num(raw.step ?? 1, `${path}.step`, 1e-6, MAX_ABS),
    prefix: text(raw.prefix, `${path}.prefix`, 8, ''),
    suffix: text(raw.suffix, `${path}.suffix`, 12, ''),
  }
  if (control.min > control.value || control.value > control.max) fail(`${path} needs min <= value <= max`)
  if ((control.max - control.min) / control.step > 10_000) fail(`${path} has more than 10000 steps`)
  if (bounds.integer && ![control.value, control.min, control.max, control.step].every(Number.isInteger)) fail(`${path} must use whole numbers`)
  return control
}

function project(initial: number, perPeriod: number, ratePercent: number, years: number, periodsPerYear: number) {
  const rate = Math.pow(1 + ratePercent / 100, 1 / periodsPerYear) - 1
  let value = initial
  let added = initial
  const result = { added: [added], projected: [value] }
  for (let year = 1; year <= years; year++) {
    for (let period = 0; period < periodsPerYear; period++) {
      value = value * (1 + rate) + perPeriod
      added += perPeriod
    }
    result.added.push(added)
    result.projected.push(value)
  }
  return result
}

function parseSpec(source: string): ChartSpec {
  if (source.length > MAX_SOURCE) fail(`spec is longer than ${MAX_SOURCE} characters`)
  let json: unknown
  try {
    json = JSON.parse(source)
  } catch {
    fail('spec is not valid JSON')
  }
  const type = (json as { type?: unknown } | null)?.type
  const shared = ['type', 'title', 'caption', 'summary', 'xLabel', 'yLabel', 'format']

  if (type === 'line' || type === 'bar') {
    const raw = record(json, 'spec', [...shared, 'labels', 'series'])
    if (!Array.isArray(raw.labels) || raw.labels.length < 2 || raw.labels.length > MAX_POINTS) fail(`labels must list 2 to ${MAX_POINTS} entries`)
    const labels = raw.labels.map((label, index) => typeof label === 'number' && Number.isFinite(label) ? String(label) : text(label, `labels[${index}]`, 30))
    if (!Array.isArray(raw.series) || !raw.series.length || raw.series.length > MAX_SERIES) fail(`series must list 1 to ${MAX_SERIES} entries`)
    const series = raw.series.map((entry, index) => {
      const item = record(entry, `series[${index}]`, ['name', 'values'])
      if (!Array.isArray(item.values) || item.values.length !== labels.length) fail(`series[${index}].values must have one number per label`)
      return { name: text(item.name, `series[${index}].name`, 60), values: item.values.map((value, point) => num(value, `series[${index}].values[${point}]`)) }
    })
    return { type, ...common(raw, 'Category'), labels, series }
  }

  if (type === 'projection') {
    const raw = record(json, 'spec', [...shared, 'periodsPerYear', 'inputs', 'seriesLabels'])
    const inputs = record(raw.inputs, 'inputs', ['initial', 'perPeriod', 'ratePercent', 'years'])
    const labels = record(raw.seriesLabels ?? {}, 'seriesLabels', ['added', 'projected'])
    const periodsPerYear = num(raw.periodsPerYear ?? 12, 'periodsPerYear', 1, 365)
    if (!Number.isInteger(periodsPerYear)) fail('periodsPerYear must be a whole number')
    const spec: ProjectionSpec = {
      type,
      ...common(raw, 'Year'),
      periodsPerYear,
      inputs: {
        initial: parseControl(inputs.initial ?? { label: 'Starting amount', value: 0 }, 'inputs.initial', { min: -1e12, max: 1e12 }),
        perPeriod: parseControl(inputs.perPeriod, 'inputs.perPeriod', { min: -1e12, max: 1e12 }),
        ratePercent: parseControl(inputs.ratePercent, 'inputs.ratePercent', { min: -100, max: 100 }),
        years: parseControl(inputs.years, 'inputs.years', { min: 1, max: 100, integer: true }),
      },
      seriesLabels: { added: text(labels.added, 'seriesLabels.added', 60, 'Total added'), projected: text(labels.projected, 'seriesLabels.projected', 60, 'Projected value') },
    }
    const { initial, perPeriod, ratePercent, years } = spec.inputs
    for (const start of [initial.min, initial.max]) for (const each of [perPeriod.min, perPeriod.max]) for (const rate of [ratePercent.min, ratePercent.max]) {
      const run = project(start, each, rate, years.max, periodsPerYear)
      if (![...run.added, ...run.projected].every(value => Math.abs(value) <= MAX_ABS)) fail('control ranges can produce values that are too large to chart')
    }
    return spec
  }

  fail('type must be "line", "bar" or "projection"')
}

function common(raw: Record<string, unknown>, xLabel: string): Common {
  return {
    title: text(raw.title, 'title', 120),
    caption: optionalText(raw.caption, 'caption', 400),
    summary: optionalText(raw.summary, 'summary', 600),
    xLabel: text(raw.xLabel, 'xLabel', 40, xLabel),
    yLabel: optionalText(raw.yLabel, 'yLabel', 40),
    format: parseFormat(raw.format),
  }
}

function formatter({ locale, prefix, suffix, decimals }: Format, compact = false) {
  const number = new Intl.NumberFormat(locale, compact ? { notation: 'compact', maximumFractionDigits: 1 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (value: number) => `${value < 0 ? '−' : ''}${prefix}${number.format(Math.abs(value))}${suffix}`
}

function niceTicks(min: number, max: number) {
  const raw = (max - min) / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = magnitude * [1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= raw)!
  const ticks: number[] = []
  for (let tick = Math.floor(min / step) * step; tick <= max + step * 1e-9; tick += step) ticks.push(Math.abs(tick) < step * 1e-9 ? 0 : tick)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

// Each series differs by dash/marker (lines) or fill pattern (bars), not colour alone.
const STYLES = [
  { color: 'var(--signal)', dash: undefined, marker: 'circle', bar: 'solid' },
  { color: 'var(--ink)', dash: '7 5', marker: 'square', bar: 'hatch' },
  { color: 'var(--muted)', dash: '2 4', marker: 'triangle', bar: 'outline' },
  { color: '#a53c36', dash: '10 4 2 4', marker: 'diamond', bar: 'dots' },
] as const

function Marker({ index, x, y }: { index: number; x: number; y: number }) {
  const { color, marker } = STYLES[index]
  if (marker === 'circle') return <circle cx={x} cy={y} r={3.5} fill={color} />
  if (marker === 'square') return <rect x={x - 3.5} y={y - 3.5} width={7} height={7} fill={color} />
  if (marker === 'triangle') return <path d={`M${x} ${y - 4.5}L${x + 4.5} ${y + 3.5}H${x - 4.5}Z`} fill={color} />
  return <path d={`M${x} ${y - 4.5}L${x + 4.5} ${y}L${x} ${y + 4.5}L${x - 4.5} ${y}Z`} fill={color} />
}

function barFill(index: number, patternId: string) {
  const { color, bar } = STYLES[index]
  if (bar === 'solid') return { fill: color }
  if (bar === 'outline') return { fill: 'var(--paper)', stroke: color, strokeWidth: 1.5 }
  return { fill: `url(#${patternId}-${bar})`, stroke: color, strokeWidth: 1 }
}

function Plot({ type, labels, series, format, title, xLabel, yLabel, patternId }: { type: 'line' | 'bar'; labels: string[]; series: Series[]; format: Format; title: string; xLabel: string; yLabel?: string; patternId: string }) {
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)

  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const all = series.flatMap(item => item.values)
  let low = Math.min(0, ...all)
  let high = Math.max(0, ...all)
  if (low === high) high = low + 1
  const ticks = niceTicks(low, high)
  low = ticks[0]
  high = ticks[ticks.length - 1]

  const compact = formatter(format, true)
  const height = Math.round(Math.min(340, Math.max(230, width * 0.55)))
  const margin = { top: 14, right: 14, bottom: 46, left: Math.min(76, 18 + Math.max(...ticks.map(tick => compact(tick).length)) * 7) }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const y = (value: number) => margin.top + plotHeight * (1 - (value - low) / (high - low))
  const band = plotWidth / labels.length
  const x = (index: number) => type === 'bar' ? margin.left + band * (index + 0.5) : margin.left + (labels.length === 1 ? plotWidth / 2 : plotWidth * index / (labels.length - 1))
  const labelEvery = Math.ceil(labels.length / Math.max(2, Math.floor(plotWidth / 64)))
  const barWidth = Math.min(28, (band * 0.72) / series.length)

  return <div className="article-chart__plot" ref={frame}>
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${type === 'bar' ? 'Bar' : 'Line'} chart of ${series.map(item => item.name).join(', ')} by ${xLabel}. Exact values are in the data table below.`}>
      <defs>
        <pattern id={`${patternId}-hatch`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width={6} height={6} fill="var(--paper)" /><line x1={0} y1={0} x2={0} y2={6} stroke={STYLES[1].color} strokeWidth={2.5} /></pattern>
        <pattern id={`${patternId}-dots`} width={6} height={6} patternUnits="userSpaceOnUse"><rect width={6} height={6} fill="var(--paper)" /><circle cx={3} cy={3} r={1.4} fill={STYLES[3].color} /></pattern>
      </defs>
      {ticks.map(tick => <g key={tick}>
        <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth={tick === 0 ? 1.4 : 1} />
        <text x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">{compact(tick)}</text>
      </g>)}
      {labels.map((label, index) => index % labelEvery === 0 || index === labels.length - 1 ? <text key={index} x={x(index)} y={height - margin.bottom + 18} textAnchor="middle">{label}</text> : null)}
      <text x={margin.left + plotWidth / 2} y={height - 6} textAnchor="middle" className="article-chart__axis">{xLabel}</text>
      {type === 'bar'
        ? series.map((item, index) => item.values.map((value, point) => {
          const top = y(Math.max(0, value))
          return <rect key={`${index}-${point}`} x={x(point) - (barWidth * series.length) / 2 + barWidth * index} y={top} width={Math.max(1, barWidth - 2)} height={Math.max(1, y(Math.min(0, value)) - top)} {...barFill(index, patternId)} />
        }))
        : series.map((item, index) => <g key={index}>
          <polyline points={item.values.map((value, point) => `${x(point)},${y(value)}`).join(' ')} fill="none" stroke={STYLES[index].color} strokeWidth={2.2} strokeDasharray={STYLES[index].dash} strokeLinejoin="round" />
          {item.values.map((value, point) => labels.length <= 24 || point === labels.length - 1 ? <Marker key={point} index={index} x={x(point)} y={y(value)} /> : null)}
        </g>)}
    </svg>
    {yLabel && <p className="article-chart__y-label">{yLabel}</p>}
  </div>
}

function Legend({ type, series, patternId }: { type: 'line' | 'bar'; series: Series[]; patternId: string }) {
  return <ul className="article-chart__legend">
    {series.map((item, index) => <li key={index}>
      <svg width={28} height={12} aria-hidden="true">
        {type === 'bar'
          ? <rect x={6} y={0} width={16} height={12} {...barFill(index, patternId)} />
          : <><line x1={1} x2={27} y1={6} y2={6} stroke={STYLES[index].color} strokeWidth={2.2} strokeDasharray={STYLES[index].dash} /><Marker index={index} x={14} y={6} /></>}
      </svg>
      {item.name}
    </li>)}
  </ul>
}

function DataTable({ labels, series, format, xLabel }: { labels: string[]; series: Series[]; format: Format; xLabel: string }) {
  const full = formatter(format)
  return <details className="article-chart__data">
    <summary>Show data table</summary>
    <div className="article-chart__table"><table>
      <thead><tr><th scope="col">{xLabel}</th>{series.map((item, index) => <th scope="col" key={index}>{item.name}</th>)}</tr></thead>
      <tbody>{labels.map((label, point) => <tr key={point}><th scope="row">{label}</th>{series.map((item, index) => <td key={index}>{full(item.values[point])}</td>)}</tr>)}</tbody>
    </table></div>
  </details>
}

function ChartBody({ spec, labels, series, summary, children }: { spec: ChartSpec; labels: string[]; series: Series[]; summary: string; children?: ReactNode }) {
  const type = spec.type === 'bar' ? 'bar' : 'line'
  const patternId = `chart${useId().replace(/[^\w-]/g, '')}`
  return <figure className="article-chart">
    <figcaption className="article-chart__title">{spec.title}</figcaption>
    {children}
    <Legend type={type} series={series} patternId={patternId} />
    <Plot type={type} labels={labels} series={series} format={spec.format} title={spec.title} xLabel={spec.xLabel} yLabel={spec.yLabel} patternId={patternId} />
    <p className="article-chart__summary" aria-live={children ? 'polite' : undefined}>{summary}</p>
    {spec.caption && <p className="article-chart__caption">{spec.caption}</p>}
    <DataTable labels={labels} series={series} format={spec.format} xLabel={spec.xLabel} />
  </figure>
}

function StaticChart({ spec }: { spec: StaticSpec }) {
  const full = formatter(spec.format)
  const last = spec.labels.length - 1
  const summary = spec.summary || `${spec.xLabel} ${spec.labels[last]}: ${spec.series.map(item => `${item.name} ${full(item.values[last])}`).join('; ')}.`
  return <ChartBody spec={spec} labels={spec.labels} series={spec.series} summary={summary} />
}

function Projection({ spec }: { spec: ProjectionSpec }) {
  const keys = ['initial', 'perPeriod', 'ratePercent', 'years'] as const
  const [values, setValues] = useState(() => Object.fromEntries(keys.map(key => [key, spec.inputs[key].value])) as Record<(typeof keys)[number], number>)
  const run = useMemo(() => project(values.initial, values.perPeriod, values.ratePercent, values.years, spec.periodsPerYear), [values, spec.periodsPerYear])
  const labels = run.added.map((_, year) => String(year))
  const series = [{ name: spec.seriesLabels.added, values: run.added }, { name: spec.seriesLabels.projected, values: run.projected }]
  const full = formatter(spec.format)
  const added = run.added[values.years]
  const projected = run.projected[values.years]
  const gap = projected - added
  const summary = `${spec.xLabel} ${values.years}: ${spec.seriesLabels.added} ${full(added)}; ${spec.seriesLabels.projected} ${full(projected)}, ${gap === 0 ? 'the same amount' : `${full(Math.abs(gap))} ${gap > 0 ? 'more' : 'less'}`}.`
  const idPrefix = `chart${useId().replace(/[^\w-]/g, '')}`
  const controls = keys.filter(key => spec.inputs[key].min < spec.inputs[key].max)

  return <ChartBody spec={spec} labels={labels} series={series} summary={spec.summary ? `${summary} ${spec.summary}` : summary}>
    {controls.length > 0 && <div className="article-chart__controls">
      {controls.map(key => {
        const control = spec.inputs[key]
        const id = `${idPrefix}-${key}`
        const decimals = Math.min(4, (String(control.step).split('.')[1] || '').length)
        const shown = `${control.prefix}${new Intl.NumberFormat(spec.format.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(values[key])}${control.suffix}`
        return <div className="article-chart__control" key={key}>
          <label htmlFor={id}>{control.label}</label>
          <output htmlFor={id}>{shown}</output>
          <input id={id} type="range" min={control.min} max={control.max} step={control.step} value={values[key]} aria-valuetext={shown} onChange={event => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) setValues(current => ({ ...current, [key]: Math.min(control.max, Math.max(control.min, next)) }))
          }} />
        </div>
      })}
    </div>}
  </ChartBody>
}

class ChartBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function ArticleChart({ source, fallback }: { source: string; fallback: ReactNode }) {
  const parsed = useMemo(() => {
    try {
      return { spec: parseSpec(source) }
    } catch (error) {
      return { error: error instanceof SpecError ? error.message : 'spec could not be read' }
    }
  }, [source])

  if (!parsed.spec) return <div className="article-chart-fallback"><p className="article-chart__error" role="note">Chart not shown: {parsed.error}.</p>{fallback}</div>
  return <ChartBoundary key={source} fallback={fallback}>
    {parsed.spec.type === 'projection' ? <Projection spec={parsed.spec} /> : <StaticChart spec={parsed.spec} />}
  </ChartBoundary>
}
