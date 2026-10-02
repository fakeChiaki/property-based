import { ValidationError } from './errors.js';

export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
}

export type UpdateTaskInput = Partial<Omit<Task, 'id'>>;

export type TaskData = Omit<Task, 'id'>;

function validateTitle(title: unknown): string {
  if (typeof title !== 'string') {
    throw new ValidationError('Title must be a string');
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Title must not be empty');
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    throw new ValidationError(`Title must have at most ${TITLE_MAX_LENGTH} characters`);
  }
  return trimmed;
}

function validateDescription(description: unknown): string {
  if (typeof description !== 'string') {
    throw new ValidationError('Description must be a string');
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`Description must have at most ${DESCRIPTION_MAX_LENGTH} characters`);
  }
  return description;
}

function validateStatus(status: unknown): TaskStatus {
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new ValidationError(`Status must be one of: ${TASK_STATUSES.join(', ')}`);
  }
  return status as TaskStatus;
}

function validatePriority(priority: unknown): TaskPriority {
  if (!TASK_PRIORITIES.includes(priority as TaskPriority)) {
    throw new ValidationError(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`);
  }
  return priority as TaskPriority;
}

export function validateCreateInput(input: CreateTaskInput): TaskData {
  return {
    title: validateTitle(input.title),
    description: validateDescription(input.description ?? ''),
    status: 'pending',
    priority: validatePriority(input.priority ?? 'medium'),
  };
}

export function validateUpdateInput(changes: UpdateTaskInput): UpdateTaskInput {
  const validated: { -readonly [K in keyof UpdateTaskInput]: UpdateTaskInput[K] } = {};
  if (changes.title !== undefined) validated.title = validateTitle(changes.title);
  if (changes.description !== undefined) validated.description = validateDescription(changes.description);
  if (changes.status !== undefined) validated.status = validateStatus(changes.status);
  if (changes.priority !== undefined) validated.priority = validatePriority(changes.priority);
  return validated;
}
