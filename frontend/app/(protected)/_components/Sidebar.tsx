"use client";

import Link from "next/link";
import {
  DashboardIcon,
  SchedulesIcon,
  SettingsIcon,
  TransactionsIcon,
  UsersIcon,
} from "@/ui/icons";

const navItems = [
  { label: "Dashboard", icon: DashboardIcon },
  { label: "Transactions", icon: TransactionsIcon },
  { label: "Schedules", icon: SchedulesIcon },
  { label: "Users", icon: UsersIcon },
  { label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  return (
    <div className="flex h-full flex-col px-[30px] py-10 text-primary-foreground">
      <p className="font-heading text-[36px] leading-[44px] font-bold">Dash.</p>
      <nav className="mt-[68px] flex flex-col gap-[42px]">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === 0;

          return (
            <Link
              key={item.label}
              href="#"
              className="flex items-center gap-[15px] text-primary-foreground transition-opacity hover:opacity-100"
            >
              <Icon className="h-5 w-5 shrink-0" size={20} />
              <span
                className={
                  isActive
                    ? "text-[18px] leading-[22px] font-bold text-primary-foreground"
                    : "text-[18px] leading-[22px] font-normal"
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-16 flex flex-col gap-3 text-sm leading-[17px] text-primary-foreground lg:mt-auto">
        <Link href="#" className="w-fit transition-opacity hover:opacity-100">
          Help
        </Link>
        <Link href="#" className="w-fit transition-opacity hover:opacity-100">
          Contact Us
        </Link>
      </div>
    </div>
  );
}
