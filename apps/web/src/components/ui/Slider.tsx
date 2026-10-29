import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface SliderProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'onChange'
> {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  unit: string
  /** Formats the shown value, such as rounding an unset default; the slider still holds the exact value. */
  formatValue?: (value: number) => string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    label,
    min,
    max,
    step,
    value,
    onChange,
    unit,
    formatValue = String,
    id: providedId,
    className,
    disabled,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const percentage = max === min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const activeTrack = disabled ? 'var(--color-border-control)' : 'var(--color-text-primary)'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className={cn('text-label-m text-text-primary', disabled && 'text-text-muted')}>
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-mono-m text-text-primary">
          {formatValue(value)} {unit}
        </output>
      </div>
      <input
        {...props}
        ref={ref}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={formatValue(value) + ' ' + unit}
        aria-invalid={ariaInvalid}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{
          backgroundColor: 'var(--color-bg-panel)',
          backgroundImage:
            'linear-gradient(to right, ' +
            activeTrack +
            ' 0%, ' +
            activeTrack +
            ' ' +
            percentage +
            '%, var(--color-border-subtle) ' +
            percentage +
            '%, var(--color-border-subtle) 100%)',
          backgroundSize: '100% 4px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        className={cn(
          'h-6 w-full appearance-none rounded-full bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-10px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-text-primary [&::-webkit-slider-thumb]:bg-accent-box [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-text-primary [&::-moz-range-thumb]:bg-accent-box disabled:[&::-webkit-slider-thumb]:border-border-subtle disabled:[&::-webkit-slider-thumb]:bg-bg-panel disabled:[&::-moz-range-thumb]:border-border-subtle disabled:[&::-moz-range-thumb]:bg-bg-panel',
          ariaInvalid && 'ring-1 ring-state-error',
          className
        )}
      />
      <div className="flex items-center justify-between font-mono text-mono-s text-text-muted">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  )
})
