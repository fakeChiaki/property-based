import fc from 'fast-check';
import {
  type CreateTaskInput,
  DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
  TITLE_MAX_LENGTH,
  type UpdateTaskInput,
} from '../src/task.js';

const whitespaceArb = fc.string({ unit: fc.constantFrom(' ', '\t', '\n'), maxLength: 5 });

const trimmedTitleArb = fc
  .string({ minLength: 1, maxLength: TITLE_MAX_LENGTH })
  .filter((s) => s.trim() === s && s.length > 0);

export const validTitleArb = fc
  .tuple(whitespaceArb, trimmedTitleArb, whitespaceArb)
  .map(([before, title, after]) => before + title + after);

export const invalidTitleArb = fc.oneof(
  whitespaceArb,
  fc
    .string({ minLength: TITLE_MAX_LENGTH + 1, maxLength: TITLE_MAX_LENGTH * 2 })
    .filter((s) => s.trim().length > TITLE_MAX_LENGTH),
);

export const validDescriptionArb = fc.string({ maxLength: DESCRIPTION_MAX_LENGTH });

export const invalidDescriptionArb = fc.string({
  minLength: DESCRIPTION_MAX_LENGTH + 1,
  maxLength: DESCRIPTION_MAX_LENGTH + 100,
});

export const statusArb = fc.constantFrom(...TASK_STATUSES);

export const priorityArb = fc.constantFrom(...TASK_PRIORITIES);

export const invalidStatusArb = fc
  .string()
  .filter((s) => !TASK_STATUSES.includes(s as TaskStatus))
  .map((s) => s as TaskStatus);

export const invalidPriorityArb = fc
  .string()
  .filter((s) => !TASK_PRIORITIES.includes(s as TaskPriority))
  .map((s) => s as TaskPriority);

export const createInputArb: fc.Arbitrary<CreateTaskInput> = fc.record(
  {
    title: validTitleArb,
    description: validDescriptionArb,
    priority: priorityArb,
  },
  { requiredKeys: ['title'] },
);

export const invalidCreateInputArb: fc.Arbitrary<CreateTaskInput> = fc.oneof(
  fc.record({ title: invalidTitleArb }),
  fc.record({ title: validTitleArb, description: invalidDescriptionArb }),
  fc.record({ title: validTitleArb, priority: invalidPriorityArb }),
);

export const updateInputArb: fc.Arbitrary<UpdateTaskInput> = fc.record(
  {
    title: validTitleArb,
    description: validDescriptionArb,
    status: statusArb,
    priority: priorityArb,
  },
  { requiredKeys: [] },
);

export const invalidUpdateInputArb: fc.Arbitrary<UpdateTaskInput> = fc.oneof(
  fc.record({ title: invalidTitleArb }),
  fc.record({ description: invalidDescriptionArb }),
  fc.record({ status: invalidStatusArb }),
  fc.record({ priority: invalidPriorityArb }),
);

export const idArb = fc.uuid();
