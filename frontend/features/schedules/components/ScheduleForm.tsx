"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm, useWatch } from "react-hook-form";
import * as v from "valibot";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { cn } from "@/lib/utils";
import type { CreateScheduleBody, ScheduleAccent } from "../schedules.types";

interface ScheduleFormValues {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  accent: ScheduleAccent;
}

interface ScheduleFormProps {
  defaultDate: string;
  errorMessage?: string;
  onCancel?: () => void;
  onSubmit?: (payload: CreateScheduleBody) => Promise<void> | void;
}

const scheduleFormSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "Title must be at least 2 characters"),
  ),
  date: v.pipe(v.string(), v.minLength(1, "Select a date")),
  startTime: v.pipe(v.string(), v.minLength(1, "Select a start time")),
  endTime: v.pipe(v.string(), v.minLength(1, "Select an end time")),
  location: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "Location must be at least 2 characters"),
  ),
  accent: v.picklist(["GREEN", "PURPLE"], "Select an accent"),
});

const accentOptions: Array<{
  value: ScheduleAccent;
  label: string;
  color: string;
}> = [
  {
    value: "GREEN",
    label: "Green",
    color: "var(--schedule-item-green)",
  },
  {
    value: "PURPLE",
    label: "Purple",
    color: "var(--schedule-item-purple)",
  },
];

function toScheduleDateTime(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

export function ScheduleForm({
  defaultDate,
  errorMessage,
  onCancel,
  onSubmit,
}: ScheduleFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    resolver: valibotResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      date: defaultDate,
      startTime: "14:00",
      endTime: "15:00",
      location: "",
      accent: "GREEN",
    },
  });

  const handleAccentChange = (accent: ScheduleAccent) => {
    setValue("accent", accent, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const selectedAccent = useWatch({
    control,
    name: "accent",
  });

  const submitScheduleForm = async (values: ScheduleFormValues) => {
    await onSubmit?.({
      title: values.title.trim(),
      startsAt: toScheduleDateTime(values.date, values.startTime),
      endsAt: toScheduleDateTime(values.date, values.endTime),
      location: values.location.trim(),
      accent: values.accent,
    });
  };

  return (
    <form
      noValidate
      className="grid gap-[18px]"
      onSubmit={handleSubmit(submitScheduleForm)}
    >
      <div className="grid gap-[8px]">
        <Label
          className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
          htmlFor="schedule-title"
        >
          Title
        </Label>
        <Input
          autoComplete="off"
          className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
          id="schedule-title"
          placeholder="Meeting with suppliers"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "schedule-title-error" : undefined}
          {...register("title")}
        />
        {errors.title ? (
          <p
            className="mt-1 text-xs text-destructive"
            id="schedule-title-error"
          >
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-[1fr_118px_118px]">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="schedule-date"
          >
            Date
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="schedule-date"
            type="date"
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "schedule-date-error" : undefined}
            {...register("date")}
          />
          {errors.date ? (
            <p
              className="mt-1 text-xs text-destructive"
              id="schedule-date-error"
            >
              {errors.date.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="schedule-start-time"
          >
            Starts
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="schedule-start-time"
            type="time"
            aria-invalid={Boolean(errors.startTime)}
            aria-describedby={
              errors.startTime ? "schedule-start-time-error" : undefined
            }
            {...register("startTime")}
          />
          {errors.startTime ? (
            <p
              className="mt-1 text-xs text-destructive"
              id="schedule-start-time-error"
            >
              {errors.startTime.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="schedule-end-time"
          >
            Ends
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="schedule-end-time"
            type="time"
            aria-invalid={Boolean(errors.endTime)}
            aria-describedby={
              errors.endTime ? "schedule-end-time-error" : undefined
            }
            {...register("endTime")}
          />
          {errors.endTime ? (
            <p
              className="mt-1 text-xs text-destructive"
              id="schedule-end-time-error"
            >
              {errors.endTime.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-[8px]">
        <Label
          className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
          htmlFor="schedule-location"
        >
          Location
        </Label>
        <textarea
          className="min-h-[74px] w-full resize-none rounded-[12px] border-0 bg-input px-[14px] py-[12px] text-[14px] leading-[18px] text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20"
          id="schedule-location"
          placeholder="at Sunset Road, Kuta, Bali"
          aria-invalid={Boolean(errors.location)}
          aria-describedby={
            errors.location ? "schedule-location-error" : undefined
          }
          {...register("location")}
        />
        {errors.location ? (
          <p
            className="mt-1 text-xs text-destructive"
            id="schedule-location-error"
          >
            {errors.location.message}
          </p>
        ) : null}
      </div>

      <fieldset className="grid gap-[8px]">
        <legend className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground">
          Accent
        </legend>
        <div className="grid grid-cols-2 gap-[10px]">
          {accentOptions.map((option) => {
            const isSelected = selectedAccent === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex h-[42px] cursor-pointer items-center gap-[10px] rounded-[12px] border border-transparent bg-input px-[13px] text-left font-heading text-[13px] font-bold text-card-foreground transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isSelected &&
                    "border-primary bg-primary/10 text-card-foreground",
                )}
                aria-pressed={isSelected}
                onClick={() => handleAccentChange(option.value)}
              >
                <span
                  className="size-[10px] rounded-full"
                  style={{ backgroundColor: option.color }}
                  aria-hidden="true"
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-[10px] pt-[4px]">
        <Button
          type="button"
          variant="secondary"
          className="h-[38px] rounded-[10px] px-[18px] font-heading text-[14px] font-bold"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-[38px] rounded-[10px] px-[20px] font-heading text-[14px] font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
      {errorMessage ? (
        <p className="text-right text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </form>
  );
}
