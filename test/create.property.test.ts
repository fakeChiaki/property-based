import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ValidationError } from '../src/errors.js';
import { createInputArb, invalidCreateInputArb } from './arbitraries.js';
import { repositoryWith } from './helpers.js';

describe('Create', () => {
  it('toda tarea creada con datos válidos refleja la entrada normalizada y parte en estado pending', () => {
    fc.assert(
      fc.property(createInputArb, (input) => {
        const { repo } = repositoryWith([]);

        const task = repo.create(input);

        expect(task).toEqual({
          id: task.id,
          title: input.title.trim(),
          description: input.description ?? '',
          status: 'pending',
          priority: input.priority ?? 'medium',
        });
      }),
    );
  });

  it('crear N tareas válidas produce N tareas con identificadores únicos', () => {
    fc.assert(
      fc.property(fc.array(createInputArb, { maxLength: 50 }), (inputs) => {
        const { repo, tasks } = repositoryWith(inputs);

        const ids = new Set(tasks.map((task) => task.id));

        expect(ids.size).toBe(inputs.length);
        expect(repo.list()).toHaveLength(inputs.length);
      }),
    );
  });

  it('crear una tarea con datos inválidos lanza ValidationError y no modifica el estado', () => {
    fc.assert(
      fc.property(fc.array(createInputArb, { maxLength: 20 }), invalidCreateInputArb, (inputs, invalid) => {
        const { repo } = repositoryWith(inputs);
        const before = repo.list();

        expect(() => repo.create(invalid)).toThrow(ValidationError);
        expect(repo.list()).toEqual(before);
      }),
    );
  });
});
