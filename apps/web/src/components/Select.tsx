import React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { CaretDown, CaretUp } from "@/components/Icons";
import { SelectItem } from "@/components/SelectItem";

type SelectOption = {
  value: string;
  label: string;
  [key: string]: any;
};

interface SelectProps extends Omit<RadixSelect.SelectProps, "children"> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder, ...rest }: SelectProps) {
  return (
    <RadixSelect.Root {...rest}>
      <RadixSelect.Trigger
        className="inline-flex h-[35px] w-full flex-1 items-center justify-between rounded-[4px] bg-white px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
        aria-label="Food"
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <CaretDown />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
          <RadixSelect.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-indigo-600">
            <CaretUp />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-[5px]">
            {options.map(({ value, label, ...optionRest }) => (
              <SelectItem key={value} value={value} {...optionRest}>
                {label}
              </SelectItem>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-indigo-600">
            <CaretDown />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
