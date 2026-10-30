import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { commonText } from '../../i18n/common'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export type StepperStep = 1 | 2 | 3 | 4 | 5

export interface StepperProps extends ComponentPropsWithoutRef<'div'> {
  step: StepperStep | number
  // Without labels, the Check-Up flow's five steps in the current language, so every page names them the same way.
  labels?: readonly [string, string, string, string, string]
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { step, labels, className, ...props },
  ref
) {
  const common = useText(commonText)
  const t = useText(uiText)
  const defaultLabels: readonly [string, string, string, string, string] = [
    common.steps.start,
    common.steps.questions,
    common.steps.radar,
    common.steps.roles,
    common.steps.plan
  ]
  const resolvedLabels = labels ?? defaultLabels
  const clampedStep = Math.min(5, Math.max(1, step))
  const currentLabel = resolvedLabels[clampedStep - 1] ?? ''

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t.stepOfAria(clampedStep, resolvedLabels.length, currentLabel)}
      className={cn('w-full space-y-2', className)}
      {...props}
    >
      <div className="font-mono text-mono-s text-text-primary">
        {t.stepOfText(clampedStep, resolvedLabels.length, currentLabel)}
      </div>
      <div className="grid grid-cols-5 gap-2" aria-hidden="true">
        {resolvedLabels.map((label, index) => {
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
