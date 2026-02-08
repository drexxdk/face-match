'use client';

import { Listbox as HeadlessListbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';
import { Icon } from './icon';

interface ListboxOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ListboxProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: ListboxOption<T>[];
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

export function Listbox<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  className,
  id,
  placeholder = 'Select an option',
}: ListboxProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <HeadlessListbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          id={id}
          className={cn(
            'border-input bg-background focus:ring-ring focus:ring-offset-background relative flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none',
            disabled && 'cursor-not-allowed opacity-50',
            className,
          )}
        >
          <span className={cn(!selectedOption && 'text-muted-foreground')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <Icon icon={FaChevronDown} size="sm" className="text-muted-foreground" />
        </ListboxButton>

        <ListboxOptions
          className={cn(
            'bg-card border-border absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-lg',
            'focus:outline-none',
            'data-closed:scale-95 data-closed:opacity-0',
            'transition duration-100 ease-out data-closed:duration-75',
          )}
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={({ focus, selected }) =>
                cn(
                  'relative cursor-pointer px-3 py-2 text-sm select-none',
                  focus && 'bg-primary/10',
                  selected && 'bg-primary/5',
                  option.disabled && 'cursor-not-allowed opacity-50',
                )
              }
            >
              {({ selected }) => (
                <div className="flex items-center justify-between">
                  <span className={cn(selected && 'font-medium')}>{option.label}</span>
                  {selected && <Icon icon={FaCheck} size="sm" className="text-primary" />}
                </div>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </HeadlessListbox>
  );
}
