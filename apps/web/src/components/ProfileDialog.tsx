"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProfileForm = { name: string; color: string; avatarType: string };

const colorsOptions = [
  {
    value: "blue",
    label: "blue",
  },
  {
    value: "green",
    label: "green",
  },
  {
    value: "pink",
    label: "pink",
  },
  {
    value: "orange",
    label: "orange",
  },
];

const FormSchema = z.object({
  name: z
    .string({
      required_error: "You need to type a name",
    })
    .min(1, "You need to type a name"),
  color: z.string({
    required_error: "You need to select a color",
  }),
  avatarType: z.string({
    required_error: "You need to select a avatar type",
  }),
});

interface ProfileDialogProps {
  isOpen: boolean;
  onSubmit: (data: ProfileForm) => void;
}

export function ProfileDialog({ isOpen, onSubmit }: ProfileDialogProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      color: "blue",
      avatarType: "gentleman",
    },
  });
  const { reset } = form;

  useEffect(() => {
    const profileStorage = localStorage.getItem("bumbadum-profile");

    if (profileStorage) {
      reset(JSON.parse(profileStorage));
    }
  }, [reset]);

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogTitle>Let we know you</DialogTitle>
        <DialogDescription>
          We need to know who you are my boy, or girl, or... ok, you understand
          my issue now? :(
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Kurt Cobain" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a color to use on chat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorsOptions.map((color) => (
                        <SelectItem
                          key={color.value}
                          value={color.value}
                          className="cursor-pointer"
                        >
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your avatar type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "gentleman", label: "gentleman" },
                        { value: "cute-girl", label: "cute girl" },
                      ].map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="cursor-pointer"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
