import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export type StepperStep = 1 | 2 | 3 | 4 | 5

// The Check-Up flow's five steps, shared so every page names them the same way.
export const checkUpSteps: [string, string, string, string, string] = ['Start', 'Questions', 'Radar', 'Roles', 'Plan']

export interface StepperProps extends ComponentPropsWithoutRef<'div'> {
  step: StepperStep | number
  labels: [string, string, string, string, string]
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { step, labels, className, ...props },
  ref
) {
  const clampedStep = Math.min(5, Math.max(1, step))
  const currentLabel = labels[clampedStep - 1] ?? ''

  return (
    <div
      ref={ref}
      role="group"
      aria-label={`Step ${clampedStep} of 5: ${currentLabel}`}
      className={cn('w-full space-y-2', className)}
      {...props}
    >
      <div className="font-mono text-mono-s text-text-primary">
        Step {clampedStep} of 5 · {currentLabel}
      </div>
      <div className="grid grid-cols-5 gap-2" aria-hidden="true">
        {labels.map((label, index) => {
          const stepNumber = index + 1
          const isFilled = stepNumber <= clampedStep

          return (
            <div
              key={label}
              className={cn(
                'h-1.5 w-full rounded-full transition-colors duration-150 ease-out',
                isFilled ? 'bg-text-primary' : 'bg-border-subtle'
              )}
            />
          )
        })}
      </div>
    </div>
  )
})
