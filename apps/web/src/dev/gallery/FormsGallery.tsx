import { AlertTriangle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Checkbox } from '../../components/ui/Checkbox'
import { DatePicker } from '../../components/ui/DatePicker'
import { PasswordField } from '../../components/ui/PasswordField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { SearchField } from '../../components/ui/SearchField'
import { Select } from '../../components/ui/Select'
import { Slider } from '../../components/ui/Slider'
import { Switch } from '../../components/ui/Switch'
import { Textarea } from '../../components/ui/Textarea'
import { TextField } from '../../components/ui/TextField'

const states = ['Default', 'Focus Ready', 'Filled', 'Error', 'Disabled'] as const
const radioOptions = [
  { value: 'slow', label: 'Slow AI Uptake', description: 'Build skills steadily.' },
  { value: 'fast', label: 'Fast AI Uptake', description: 'Prepare for faster change.' }
]
const selectOptions = [
  { value: 'ict', label: 'ICT Professionals' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'health', label: 'Healthcare' }
]
const sampleDate = new Date(2026, 10, 2)

interface StateSampleProps {
  state: string
  children: ReactNode
  errorMessage?: string
}

function StateSample({ state, children, errorMessage }: StateSampleProps) {
  const focusReady = state === 'Focus Ready'
  const hasError = state === 'Error'

  return (
    <div
      className={
        'min-w-0 space-y-4 rounded-md border bg-bg-panel p-4 ' +
        (hasError ? 'border-state-error' : 'border-border-subtle')
      }
    >
      <h3 className="text-label-m text-text-primary">{state}</h3>
      <div
        className={
          'min-w-0 rounded-sm ' +
          (focusReady ? 'outline outline-2 outline-focus-ring outline-offset-2 outline-bg-default' : '')
        }
      >
        {children}
      </div>
      {hasError && errorMessage && (
        <p className="flex items-start gap-2 text-body-s text-state-error">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
          {errorMessage}
        </p>
      )}
    </div>
  )
}

export function FormsGallery() {
  const [checkboxValues, setCheckboxValues] = useState([false, false, true, false, true])
  const [indeterminate, setIndeterminate] = useState(true)
  const [radioValues, setRadioValues] = useState(['', '', 'fast', '', 'slow'])
  const [switchValues, setSwitchValues] = useState([false, false, true, false, true])
  const [sliderValues, setSliderValues] = useState([4, 4, 6, 4, 4])
  const [selectValues, setSelectValues] = useState(['ict', 'ict', 'finance', 'ict', 'ict'])
  const [dateValues, setDateValues] = useState([sampleDate, sampleDate, new Date(2026, 10, 9), sampleDate, sampleDate])

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-12 bg-bg-default p-8 font-sans text-text-primary">
      <header className="border-b border-border-subtle pb-6">
        <h1 className="text-title-l font-bold">Form Controls Gallery</h1>
        <p className="mt-2 text-body-m text-text-muted">
          Group B controls for Kotak, shown in default, focus-ready, filled, error, and disabled states.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Text Field</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StateSample state={states[0]}>
            <TextField label="Email" type="email" placeholder="you@example.com" />
          </StateSample>
          <StateSample state={states[1]}>
            <TextField label="Email" type="email" defaultValue="you@example.com" />
          </StateSample>
          <StateSample state={states[2]}>
            <TextField label="Email" type="email" defaultValue="siti@example.com" />
          </StateSample>
          <StateSample state={states[3]}>
            <TextField label="Email" type="email" defaultValue="siti@" error="Enter a valid email address." />
          </StateSample>
          <StateSample state={states[4]}>
            <TextField label="Email" type="email" value="guest@kotak.app" disabled readOnly />
          </StateSample>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Password Field</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StateSample state={states[0]}>
            <PasswordField label="Password" placeholder="Enter your password" />
          </StateSample>
          <StateSample state={states[1]}>
            <PasswordField label="Password" defaultValue="correct-horse" />
          </StateSample>
          <StateSample state={states[2]}>
            <PasswordField label="Password" defaultValue="correct-horse" />
          </StateSample>
          <StateSample state={states[3]}>
            <PasswordField label="Password" defaultValue="short" error="Use at least 8 characters." />
          </StateSample>
          <StateSample state={states[4]}>
            <PasswordField label="Password" value="guest-only" disabled readOnly />
          </StateSample>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Search Field</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StateSample state={states[0]}>
            <SearchField label="Search Roles" placeholder="Search 900 Jobs" />
          </StateSample>
          <StateSample state={states[1]}>
            <SearchField label="Search Roles" placeholder="Search roles" />
          </StateSample>
          <StateSample state={states[2]}>
            <SearchField label="Search Roles" placeholder="Search roles" defaultValue="front-end" />
          </StateSample>
          <StateSample state={states[3]} errorMessage="No matching roles were found.">
            <SearchField label="Search Roles" placeholder="Search roles" defaultValue="unknown role" aria-invalid />
          </StateSample>
          <StateSample state={states[4]}>
            <SearchField label="Search Roles" placeholder="Search roles" value="All roles" disabled readOnly />
          </StateSample>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Textarea</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StateSample state={states[0]}>
            <Textarea
              label="Paste a Job Ad"
              placeholder="Paste the full ad. Kopi highlights every skill it finds."
              rows={4}
            />
          </StateSample>
          <StateSample state={states[1]}>
            <Textarea label="Paste a Job Ad" defaultValue="We are hiring a front-end developer." rows={4} />
          </StateSample>
          <StateSample state={states[2]}>
            <Textarea
              label="Paste a Job Ad"
              defaultValue="We are hiring a front-end developer who can review AI-written code and build accessible pages."
              rows={4}
            />
          </StateSample>
          <StateSample state={states[3]}>
            <Textarea label="Paste a Job Ad" rows={4} error="Paste a job ad to continue." />
          </StateSample>
          <StateSample state={states[4]}>
            <Textarea label="Paste a Job Ad" value="Guest access is read only." rows={4} disabled readOnly />
          </StateSample>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Checkbox</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {states.map((state, index) => (
            <StateSample
              key={state}
              state={state}
              errorMessage={index === 3 ? 'Choose this option to continue.' : undefined}
            >
              <Checkbox
                label="Remind Me Every Week"
                checked={checkboxValues[index]}
                disabled={index === 4}
                aria-invalid={index === 3 ? true : undefined}
                onChange={(checked) =>
                  setCheckboxValues((current) =>
                    current.map((value, itemIndex) => (itemIndex === index ? checked : value))
                  )
                }
              />
            </StateSample>
          ))}
          <StateSample state="Indeterminate">
            <Checkbox
              label="Remind Me Every Week"
              checked={indeterminate ? false : checkboxValues[0]}
              indeterminate={indeterminate}
              onChange={(checked) => {
                setCheckboxValues((current) => [checked, ...current.slice(1)])
                setIndeterminate(false)
              }}
            />
          </StateSample>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Radio Group</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {states.map((state, index) => (
            <StateSample
              key={state}
              state={state}
              errorMessage={index === 3 ? 'Choose the pace that fits you.' : undefined}
            >
              <RadioGroup
                label="AI Uptake"
                options={radioOptions}
                value={radioValues[index]}
                disabled={index === 4}
                aria-invalid={index === 3 ? true : undefined}
                className={index === 3 ? 'rounded-sm border border-state-error p-2' : undefined}
                onChange={(value) =>
                  setRadioValues((current) =>
                    current.map((currentValue, itemIndex) => (itemIndex === index ? value : currentValue))
                  )
                }
              />
            </StateSample>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Switch</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {states.map((state, index) => (
            <StateSample
              key={state}
              state={state}
              errorMessage={index === 3 ? 'This setting needs review.' : undefined}
            >
              <Switch
                label="Kopi’s voice"
                checked={switchValues[index]}
                disabled={index === 4}
                aria-invalid={index === 3 ? true : undefined}
                onChange={(checked) =>
                  setSwitchValues((current) =>
                    current.map((value, itemIndex) => (itemIndex === index ? checked : value))
                  )
                }
              />
            </StateSample>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Slider</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {states.map((state, index) => (
            <StateSample
              key={state}
              state={state}
              errorMessage={index === 3 ? 'Choose between 1 and 10 hours.' : undefined}
            >
              <Slider
                label="Hours Per Week"
                min={1}
                max={10}
                step={1}
                value={sliderValues[index]}
                unit="h"
                disabled={index === 4}
                aria-invalid={index === 3 ? true : undefined}
                onChange={(value) =>
                  setSliderValues((current) =>
                    current.map((currentValue, itemIndex) => (itemIndex === index ? value : currentValue))
                  )
                }
              />
            </StateSample>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Select</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {states.map((state, index) => (
            <StateSample
              key={state}
              state={state}
              errorMessage={index === 3 ? 'Choose an occupation group.' : undefined}
            >
              <Select
                label="Occupation Group"
                options={selectOptions}
                value={selectValues[index]}
                disabled={index === 4}
                aria-invalid={index === 3 ? true : undefined}
                onChange={(value) =>
                  setSelectValues((current) =>
                    current.map((currentValue, itemIndex) => (itemIndex === index ? value : currentValue))
                  )
                }
              />
            </StateSample>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Date Picker</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {states.map((state, index) => (
            <StateSample key={state} state={state} errorMessage={index === 3 ? 'Choose a plan start date.' : undefined}>
              <DatePicker
                label="Plan Start Date"
                value={dateValues[index]}
                min={sampleDate}
                disabled={index === 4}
                aria-invalid={index === 3 ? true : undefined}
                onChange={(value) =>
                  setDateValues((current) =>
                    current.map((currentValue, itemIndex) => (itemIndex === index ? value : currentValue))
                  )
                }
              />
            </StateSample>
          ))}
        </div>
      </section>
    </div>
  )
}
