import type { UserListItem } from "../users.types";

interface UserRecordRowProps {
  user: UserListItem;
  isHighlighted?: boolean;
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}

export function UserRecordRow({
  user,
  isHighlighted = false,
}: UserRecordRowProps) {
  const initials = getInitials(user.name);

  return (
    <div
      role="row"
      className={[
        "grid w-full min-w-0 grid-cols-[42px_minmax(0,1.15fr)_minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.75fr)] items-center rounded-[8px] px-[16px] text-[12px] leading-[14px] text-foreground sm:grid-cols-[52px_minmax(0,1.15fr)_minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.75fr)]",
        "h-[53px]",
        isHighlighted ? "bg-input" : "bg-background",
      ].join(" ")}
    >
      <div role="cell">
        <div
          className="flex size-[30px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#d7b79a_0%,#f2d2b9_45%,#6c889a_46%,#263342_100%)] font-heading text-[10px] font-bold text-white shadow-[0_1px_3px_rgba(17,17,17,0.18)]"
          aria-label={`${user.name} avatar`}
        >
          {initials}
        </div>
      </div>
      <div role="cell" className="truncate pr-4">
        {user.name}
      </div>
      <div role="cell" className="truncate pr-4">
        {user.email}
      </div>
      <div role="cell" className="truncate pr-4">
        Not set
      </div>
      <div role="cell" className="truncate">
        User
      </div>
    </div>
  );
}
