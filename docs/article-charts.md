# Article charts

Article bodies (and the About page) are Markdown. To add a chart, write a fenced code block whose language is exactly `article-chart` and whose body is a JSON object. Nothing else changes: other code blocks, tables, images and links render as before, and existing articles need no edits.

The JSON is data only. It cannot contain HTML, scripts, formulas or URLs, and nothing is fetched. If a block cannot be read (bad JSON, an unknown `type`, an unknown field, a missing required field, a value out of range, or more than 10,000 characters), the article shows a one-line "Chart not shown: …" note with the reason, then the original block as an ordinary code block. The admin live preview uses the same renderer, so mistakes show up while editing.

Every chart renders a title, a legend, an SVG chart that resizes to the column, a one-sentence text summary, an optional caption and a collapsible data table with exact values. Series are told apart by dash pattern and marker shape (lines) or fill pattern (bars) as well as colour.

## Shared fields

| Field | Required | Limit | Meaning |
| --- | --- | --- | --- |
| `type` | yes | `"line"`, `"bar"` or `"projection"` | Chart kind |
| `title` | yes | 120 chars | Shown above the chart and used in its accessible name |
| `caption` | no | 400 chars | Small note under the summary, such as a source or a disclaimer |
| `summary` | no | 600 chars | Line/bar: replaces the generated summary. Projection: appended after the generated summary |
| `xLabel` | no | 40 chars | Horizontal axis name. Default `"Category"` (line/bar) or `"Year"` (projection) |
| `yLabel` | no | 40 chars | Shown under the chart as the value axis name |
| `format` | no | object | How values are printed: `locale` (default `"en-IN"`), `prefix` (≤ 8 chars, e.g. `"₹"`, `"$"`), `suffix` (≤ 12 chars, e.g. `"%"`, `" kg"`), `decimals` (0–4, default 0) |

Axis ticks use compact notation for the locale (for `en-IN`: `12L`, `1.2Cr`); the summary and data table use full numbers.

## Line and bar charts

`labels` lists 2–60 horizontal positions (text up to 30 chars, or numbers). `series` lists 1–4 entries, each with a `name` (≤ 60 chars) and one finite number per label in `values` (absolute value ≤ 10^15). Bars grow from zero, so negative values point down. The generated summary reports every series at the last label.

````md
```article-chart
{
  "type": "bar",
  "title": "Weekly running distance",
  "xLabel": "Week",
  "yLabel": "Kilometres",
  "format": { "suffix": " km", "decimals": 1 },
  "labels": ["1", "2", "3", "4"],
  "series": [
    { "name": "Planned", "values": [20, 24, 26, 18] },
    { "name": "Actual", "values": [18.5, 25, 21, 19.2] }
  ]
}
```
````

Change `"type"` to `"line"` for the same data as lines.

## Projection

An interactive chart of a quantity that starts at an initial amount, receives a fixed addition every period, and grows or shrinks at a constant yearly rate. It draws two lines for each whole year from 0 to the chosen number of years: the running total of what was added (initial amount plus every addition) and the projected value.

The calculation, for each period: `value = value × (1 + r) + perPeriod`, where `r = (1 + ratePercent / 100)^(1 / periodsPerYear) − 1`. Additions arrive at the end of each period. A 0% rate makes both lines equal; a negative rate makes the projected value fall below the amount added; −100% reduces the value to only the latest addition.

| Field | Required | Limit | Meaning |
| --- | --- | --- | --- |
| `periodsPerYear` | no | whole number 1–365, default 12 | Additions per year (12 monthly, 52 weekly, 1 yearly) |
| `inputs.initial` | no | −10^12 to 10^12 | Starting amount. Default: fixed at 0 |
| `inputs.perPeriod` | yes | −10^12 to 10^12 | Amount added each period (negative means a withdrawal) |
| `inputs.ratePercent` | yes | −100 to 100 | Yearly rate in percent |
| `inputs.years` | yes | whole numbers 1–100 | Length of the projection |
| `seriesLabels.added` | no | 60 chars, default `"Total added"` | Name of the running total line |
| `seriesLabels.projected` | no | 60 chars, default `"Projected value"` | Name of the projected line |

Each input is an object: `label` (required, ≤ 60 chars), `value` (required starting value), optional `min`, `max`, `step` (default 1) and display-only `prefix`/`suffix` for its readout. When `min` and `max` are given and differ, the reader gets a labelled slider (arrow keys, Page Up/Down, Home/End work as with any native range input). When they are omitted the input is fixed at `value` and no slider is shown. `min ≤ value ≤ max` must hold, and a slider may have at most 10,000 steps. The chart is rejected if the extreme corners of the slider ranges could produce values above 10^15.

The generated summary reads, for example: "Year 20: Total put in ₹24,00,000; Hypothetical value ₹56,89,991, ₹32,89,991 more." and updates as sliders move (announced politely to screen readers).

````md
```article-chart
{
  "type": "projection",
  "title": "Regular contributions versus hypothetical growth",
  "caption": "Illustration only. Assumes a constant rate, which real returns never are.",
  "xLabel": "Year",
  "yLabel": "Rupees",
  "format": { "locale": "en-IN", "prefix": "₹" },
  "periodsPerYear": 12,
  "inputs": {
    "perPeriod": { "label": "Monthly contribution", "value": 10000, "min": 1000, "max": 100000, "step": 1000, "prefix": "₹" },
    "ratePercent": { "label": "Yearly rate", "value": 8, "min": -10, "max": 15, "step": 0.5, "suffix": "%" },
    "years": { "label": "Years", "value": 20, "min": 1, "max": 40, "step": 1 }
  },
  "seriesLabels": { "added": "Total put in", "projected": "Hypothetical value" }
}
```
````

Add `"initial": { "label": "Starting amount", "value": 50000, "min": 0, "max": 1000000, "step": 10000, "prefix": "₹" }` inside `inputs` to include a lump sum.
