import type { CreateTaskInput, Task } from '../src/task.js';
import { TaskRepository } from '../src/task-repository.js';

export function repositoryWith(inputs: CreateTaskInput[]): { repo: TaskRepository; tasks: Task[] } {
  const repo = new TaskRepository();
  const tasks = inputs.map((input) => repo.create(input));
  return { repo, tasks };
}
