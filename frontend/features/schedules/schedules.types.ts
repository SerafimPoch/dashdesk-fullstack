export type ScheduleAccent = "GREEN" | "PURPLE";

export interface ScheduleItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  accent: ScheduleAccent;
}

export interface SchedulesListParams {
  date?: string;
}

export interface SchedulesListResponse {
  items: ScheduleItem[];
}

export interface CreateScheduleBody {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  accent: ScheduleAccent;
}
