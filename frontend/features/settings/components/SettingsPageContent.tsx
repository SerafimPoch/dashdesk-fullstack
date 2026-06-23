"use client";

import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/ui/spinner";
import { SettingsProfileForm } from "./SettingsProfileForm";
import { useSettingsQuery } from "../settings.queries";
import { SettingsResponse } from "../settings.api";

function SettingsSection({
  children,
  className = "",
  contentClassName = "",
  description,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  description?: string;
  title: string;
}) {
  return (
    <section
      className={cn("rounded-[20px] bg-card px-5 py-7 sm:px-8", className)}
    >
      <h2 className="font-heading text-[18px] leading-[22px] font-bold text-card-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className={cn("mt-5 grid gap-4", contentClassName)}>{children}</div>
    </section>
  );
}

function SettingsField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-[13px] leading-[16px] font-bold text-muted-foreground">
        {label}
      </dt>
      <dd className="min-h-5 text-[15px] leading-5 text-card-foreground">
        {value}
      </dd>
    </div>
  );
}

function SettingsLoadingState() {
  return (
    <section className="flex min-h-[420px] w-full items-center justify-center rounded-[20px] bg-card px-5 py-8 sm:px-8 lg:px-[50px] lg:py-[40px]">
      <Spinner className="h-10 w-10 text-primary" label="Loading settings" />
    </section>
  );
}

function SettingsErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Unable to load settings";

  return (
    <section className="grid min-h-[360px] w-full place-items-center rounded-[20px] bg-card px-5 py-8 sm:px-8 lg:px-[50px] lg:py-[40px]">
      <div className="max-w-[420px] text-center">
        <h2 className="font-heading text-[20px] leading-[24px] font-bold text-card-foreground">
          Settings could not be loaded
        </h2>
        <p className="mt-3 text-sm leading-5 text-muted-foreground">
          {message}
        </p>
        <Button
          type="button"
          className="mt-6 h-[38px] rounded-[10px] px-5 font-heading text-[14px] font-bold"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </section>
  );
}

function SettingsMainLayout({ settings }: { settings: SettingsResponse }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[548px_405px] xl:items-start xl:gap-[36px]">
      <SettingsSection
        title="Profile"
        className="sm:px-10 sm:py-[30px] xl:min-h-[518px]"
        contentClassName="sm:mt-[30px]"
      >
        <SettingsProfileForm settings={settings} />
      </SettingsSection>

      <div className="grid gap-5">
        <SettingsSection title="Account">
          <dl className="grid gap-4">
            <SettingsField label="Email" value={settings.account.email} />
            <SettingsField
              label="Password"
              value={
                settings.account.hasPassword
                  ? "Local password enabled"
                  : "OAuth-only account"
              }
            />
          </dl>
        </SettingsSection>

        <SettingsSection title="Security">
          <dl className="grid gap-4">
            <SettingsField
              label="Two-factor authentication"
              value={
                settings.security.twoFactorEnabled ? "Enabled" : "Disabled"
              }
            />
          </dl>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <p className="text-[15px] leading-5 text-muted-foreground">
            Account deletion controls will be added in the next phase.
          </p>
        </SettingsSection>
      </div>
    </div>
  );
}

export function SettingsPageContent() {
  const { data, error, isLoading, refetch } = useSettingsQuery();

  if (isLoading) {
    return <SettingsLoadingState />;
  }

  if (error || !data) {
    return (
      <SettingsErrorState
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="w-full space-y-[24px]">
      <SettingsMainLayout settings={data} />
    </div>
  );
}
