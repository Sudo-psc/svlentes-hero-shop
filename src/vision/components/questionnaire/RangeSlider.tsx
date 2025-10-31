'use client'

interface RangeSliderProps {
    min: number
    max: number
    step?: number
    value: number
    onChange: (value: number) => void
    label?: string
}

export function RangeSlider({ min, max, step = 1, value, onChange, label }: RangeSliderProps) {
    return (
        <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {label ? <span>{label}</span> : null}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={event => onChange(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500"
            />
            <span className="text-xs text-slate-500">{value}</span>
        </label>
    )
}
