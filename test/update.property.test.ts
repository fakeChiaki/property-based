import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TaskNotFoundError, ValidationError } from '../src/errors.js';
import type { Task } from '../src/task.js';
import { createInputArb, idArb, invalidUpdateInputArb, updateInputArb } from './arbitraries.js';
import { pick, repositoryWith } from './helpers.js';

const nonEmptyInputsArb = fc.array(createInputArb, { minLength: 1, maxLength: 20 });

describe('Update', () => {
  it('actualizar con cambios válidos aplica solo los campos indicados y conserva el id', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), updateInputArb, (inputs, index, changes) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);

        const updated = repo.update(target.id, changes);

        const expected: Task = {
          ...target,
          ...changes,
          ...(changes.title !== undefined && { title: changes.title.trim() }),
          id: target.id,
        };
        expect(updated).toEqual(expected);
        expect(repo.getById(target.id)).toEqual(expected);
      }),
    );
  });

  it('actualizar una tarea no altera las demás ni la cantidad de tareas', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), updateInputArb, (inputs, index, changes) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);
        const others = repo.list().filter((task) => task.id !== target.id);

        repo.update(target.id, changes);

        expect(repo.list()).toHaveLength(tasks.length);
        expect(repo.list().filter((task) => task.id !== target.id)).toEqual(others);
      }),
    );
  });

  it('aplicar la misma actualización dos veces equivale a aplicarla una vez', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), updateInputArb, (inputs, index, changes) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);

        const once = repo.update(target.id, changes);
        const twice = repo.update(target.id, changes);

        expect(twice).toEqual(once);
      }),
    );
  });

  it('actualizar con cambios inválidos lanza ValidationError y no modifica el estado', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), invalidUpdateInputArb, (inputs, index, changes) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);
        const before = repo.list();

        expect(() => repo.update(target.id, changes)).toThrow(ValidationError);
        expect(repo.list()).toEqual(before);
      }),
    );
  });

  it('actualizar un id inexistente lanza TaskNotFoundError y no modifica el estado', () => {
    fc.assert(
      fc.property(fc.array(createInputArb, { maxLength: 20 }), idArb, updateInputArb, (inputs, id, changes) => {
        const { repo, tasks } = repositoryWith(inputs);
        fc.pre(tasks.every((task) => task.id !== id));
        const before = repo.list();

        expect(() => repo.update(id, changes)).toThrow(TaskNotFoundError);
        expect(repo.list()).toEqual(before);
      }),
    );
  });
});
