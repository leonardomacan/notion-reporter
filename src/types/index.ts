export type TaskStatus = "nao_iniciado" | "em_andamento" | "concluido";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  blocks?: string;
}

export interface GroupedTasks {
  nao_iniciado: Task[];
  em_andamento: Task[];
  concluido: Task[];
}
