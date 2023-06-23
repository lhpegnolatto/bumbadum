import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { Check } from "@/components/Icons";

export function SelectItem({
  children,
  className,
  ...props
}: RadixSelect.SelectItemProps) {
  return (
    <RadixSelect.Item
      className={classnames(
        "relative flex h-[35px] cursor-pointer select-none items-center rounded-[3px] pl-[25px] pr-[35px] leading-none text-gray-900 data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-200 data-[highlighted]:outline-none",
        className
      )}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
        <Check />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
