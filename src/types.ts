// Type alias + union type
export type TaskStatus = "Belum Selesai" | "Selesai";
export type FilterType = "Semua" | TaskStatus;

// Interface
export interface Task {
  id: number;
  title: string;
  meeting: number; // nomor pertemuan (1-16)
  deadline: string;
  status: TaskStatus;
}

export type TaskInput = Omit<Task, "id" | "status">;