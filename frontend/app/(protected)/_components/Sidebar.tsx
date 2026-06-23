"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  LogoutIcon,
  SchedulesIcon,
  SettingsIcon,
  TransactionsIcon,
  UsersIcon,
} from "@/ui/icons";
import { logout } from "@/features/auth/auth.api";
import { useAccountStore } from "@/features/account/account.store";

const navItems = [
  { label: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
  { label: "Transactions", icon: TransactionsIcon, path: "/transaction" },
  { label: "Schedules", icon: SchedulesIcon, path: "/schedules" },
  { label: "Users", icon: UsersIcon, path: "/users" },
  { label: "Settings", icon: SettingsIcon, path: "/settings" },
] as const;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const clearCurrentUser = useAccountStore((state) => state.clearCurrentUser);

  const onLogoutClick = async () => {
    try {
      await logout();
    } finally {
      clearCurrentUser();
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <div className="flex h-full flex-col px-[30px] py-10 text-primary-foreground">
      <p className="font-heading text-[36px] leading-[44px] font-bold">Dash.</p>
      <nav className="mt-[68px] flex flex-col gap-[42px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label}
              href={item.path}
              aria-current={isActive ? "page" : undefined}
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
        <button
          onClick={onLogoutClick}
          type="button"
          className="flex cursor-pointer items-center gap-[15px] text-left text-primary-foreground transition-opacity hover:opacity-100"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" size={20} />
          <span className="text-[18px] leading-[22px] font-normal">Logout</span>
        </button>
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
