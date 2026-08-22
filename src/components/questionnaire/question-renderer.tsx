import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type Question } from '@/models/Question';

interface QuestionRendererProps {
  question: Question;
  textValue: string;
  isOptionSelected: (optionId: number) => boolean;
  onSelectSingle: (optionId: number) => void;
  onToggleOption: (optionId: number, checked: boolean) => void;
  onTextChange: (value: string) => void;
}

export default function QuestionRenderer({
  question,
  textValue,
  isOptionSelected,
  onSelectSingle,
  onToggleOption,
  onTextChange,
}: QuestionRendererProps) {
  const isDisabled = question.disabled ?? false;

  const optionLabelClasses = cn(
    'ml-2 text-base-700',
    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
  );

  switch (question.type) {
    case 'radio':
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center">
              <input
                type="radio"
                id={`${question.id}-${option.id}`}
                name={`question-${question.id}`}
                checked={isOptionSelected(option.id)}
                onChange={() => onSelectSingle(option.id)}
                disabled={isDisabled}
                className={cn(
                  'text-brand-500 h-4 w-fit',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
              />
              <label
                htmlFor={`${question.id}-${option.id}`}
                className={optionLabelClasses}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center">
              <input
                type="checkbox"
                id={`${question.id}-${option.id}`}
                checked={isOptionSelected(option.id)}
                onChange={(event) =>
                  onToggleOption(option.id, event.target.checked)
                }
                disabled={isDisabled}
                className={cn(
                  'text-brand-500 h-4 w-4 rounded-sm',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
              />
              <label
                htmlFor={`${question.id}-${option.id}`}
                className={optionLabelClasses}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      );

    case 'select': {
      const selected = question.options.find((option) =>
        isOptionSelected(option.id)
      );

      return (
        <NativeSelect
          variant="brand"
          id={String(question.id)}
          value={selected ? String(selected.id) : ''}
          onChange={(event) => onSelectSingle(Number(event.target.value))}
          disabled={isDisabled}
        >
          <option value="" disabled>
            Select an option
          </option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      );
    }

    case 'text':
      return (
        <Input
          variant="brand"
          id={String(question.id)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          disabled={isDisabled}
          placeholder={
            isDisabled ? 'This question has been locked' : 'Enter your answer'
          }
        />
      );

    case 'textarea':
      return (
        <Textarea
          variant="brand"
          id={String(question.id)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          rows={4}
          disabled={isDisabled}
          placeholder={
            isDisabled ? 'This question has been locked' : 'Enter your answer'
          }
        />
      );
  }
}
