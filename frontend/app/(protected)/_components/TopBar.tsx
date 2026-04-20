import { BellIcon } from "@/ui/icons";
import { SearchInput } from "@/ui/search-input";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <h1 className="pt-[2px] font-heading text-[24px] leading-[29px] font-bold text-foreground">
        {title}
      </h1>
      <div className="flex items-center justify-between gap-4 lg:justify-end lg:gap-[17px]">
        <SearchInput />
        <button
          type="button"
          className="flex h-5 w-[18px] items-center justify-center text-foreground transition-opacity hover:opacity-75"
          aria-label="Notifications"
        >
          <BellIcon className="shrink-0 text-foreground" size={20} />
        </button>
        <div
          className="h-[30px] w-[30px] shrink-0 rounded-full bg-violet-500"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
