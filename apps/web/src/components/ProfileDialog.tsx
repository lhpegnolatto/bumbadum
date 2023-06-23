"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Select } from "@/components/Select";

export function ProfileDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const [formValue, setFormValue] = useState<any>({});

  function handleOnSubmit() {
    localStorage.setItem("bumbadum-profile", JSON.stringify(formValue));
    setIsOpen(false);
  }

  useEffect(() => {
    const profileStorage = localStorage.getItem("bumbadum-profile");

    if (!profileStorage) {
      setIsOpen(true);
    }
  }, []);

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black-alpha-500 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-gray-700 p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
          <Dialog.Title className="m-0 text-[17px] font-medium text-gray-50">
            Let we know you
          </Dialog.Title>
          <Dialog.Description className="mb-5 mt-[10px] text-[15px] leading-normal text-gray-400">
            We need to know who you are my boy, or girl, or... ok, you
            understand my issue now? :(
          </Dialog.Description>
          <fieldset className="mb-[15px] flex items-center gap-5">
            <label
              className="w-[90px] text-right text-[15px] text-white"
              htmlFor="name"
            >
              Username
            </label>
            <input
              className="inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              id="name"
              placeholder="Kurt Cobain"
              value={formValue.name}
              onChange={(e) => {
                const inputValue = e.target.value;
                setFormValue((curr: any) => ({ ...curr, name: inputValue }));
              }}
            />
          </fieldset>
          <fieldset className="mb-[15px] flex items-center gap-5">
            <label
              className="w-[90px] text-right text-[15px] text-white"
              htmlFor="username"
            >
              Color
            </label>
            <Select
              value={formValue.color}
              onValueChange={(selectedValue) => {
                setFormValue((curr: any) => ({
                  ...curr,
                  color: selectedValue,
                }));
              }}
              placeholder="Select a color to use on chat..."
              options={[
                {
                  value: "blue",
                  label: "blue",
                  className: "data-[highlighted]:text-blue-400",
                },
                {
                  value: "green",
                  label: "green",
                  className: "data-[highlighted]:text-green-400",
                },
                {
                  value: "pink",
                  label: "pink",
                  className: "data-[highlighted]:text-pink-400",
                },
                {
                  value: "orange",
                  label: "orange",
                  className: "data-[highlighted]:text-orange-400",
                },
              ]}
            />
          </fieldset>
          <div className="mt-[25px] flex justify-end">
            <Dialog.Close asChild>
              <button
                disabled={!formValue.name || !formValue.color}
                className="inline-flex h-[35px] items-center justify-center rounded-[4px] bg-blue-400 px-[15px] font-medium leading-none text-white hover:bg-blue-500 focus:shadow-[0_0_0_2px] focus:shadow-blue-600 focus:outline-none disabled:opacity-30"
                onClick={handleOnSubmit}
              >
                Save changes
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
