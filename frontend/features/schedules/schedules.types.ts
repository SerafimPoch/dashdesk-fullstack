type ScheduleAccent = "green" | "purple";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  location: string;
  accent: ScheduleAccent;
}

export interface SchedulesListParams {
  date?: string;
}

export interface SchedulesListResponse {
  items: ScheduleItem[];
}
