import { randomUUID } from 'node:crypto';
import { TaskNotFoundError } from './errors.js';
import {
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
  validateCreateInput,
  validateUpdateInput,
} from './task.js';

export type IdGenerator = () => string;

export class TaskRepository {
  private readonly tasks = new Map<string, Task>();

  constructor(private readonly generateId: IdGenerator = randomUUID) {}

  create(input: CreateTaskInput): Task {
    const data = validateCreateInput(input);
    const id = this.generateId();
    if (this.tasks.has(id)) {
      throw new Error(`Generated id "${id}" is already in use`);
    }
    const task: Task = { id, ...data };
    this.tasks.set(id, task);
    return { ...task };
  }

  getById(id: string): Task {
    return { ...this.find(id) };
  }

  list(): Task[] {
    return [...this.tasks.values()].map((task) => ({ ...task }));
  }

  update(id: string, changes: UpdateTaskInput): Task {
    const current = this.find(id);
    const validated = validateUpdateInput(changes);
    const updated: Task = { ...current, ...validated };
    this.tasks.set(id, updated);
    return { ...updated };
  }

  delete(id: string): void {
    this.find(id);
    this.tasks.delete(id);
  }

  private find(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }
    return task;
  }
}
