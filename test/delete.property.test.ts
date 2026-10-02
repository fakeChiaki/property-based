import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TaskNotFoundError } from '../src/errors.js';
import { createInputArb, idArb } from './arbitraries.js';
import { pick, repositoryWith } from './helpers.js';

const nonEmptyInputsArb = fc.array(createInputArb, { minLength: 1, maxLength: 20 });

describe('Delete', () => {
  it('eliminar una tarea existente hace que deje de poder obtenerse y reduce el total en uno', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), (inputs, index) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);

        repo.delete(target.id);

        expect(() => repo.getById(target.id)).toThrow(TaskNotFoundError);
        expect(repo.list()).toHaveLength(tasks.length - 1);
      }),
    );
  });

  it('eliminar una tarea no altera las demás', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), (inputs, index) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);
        const others = repo.list().filter((task) => task.id !== target.id);

        repo.delete(target.id);

        expect(repo.list()).toEqual(others);
      }),
    );
  });

  it('eliminar dos veces la misma tarea lanza TaskNotFoundError la segunda vez', () => {
    fc.assert(
      fc.property(nonEmptyInputsArb, fc.nat(), (inputs, index) => {
        const { repo, tasks } = repositoryWith(inputs);
        const target = pick(tasks, index);

        repo.delete(target.id);
        const afterFirst = repo.list();

        expect(() => repo.delete(target.id)).toThrow(TaskNotFoundError);
        expect(repo.list()).toEqual(afterFirst);
      }),
    );
  });

  it('eliminar un id inexistente lanza TaskNotFoundError y no modifica el estado', () => {
    fc.assert(
      fc.property(fc.array(createInputArb, { maxLength: 20 }), idArb, (inputs, id) => {
        const { repo, tasks } = repositoryWith(inputs);
        fc.pre(tasks.every((task) => task.id !== id));
        const before = repo.list();

        expect(() => repo.delete(id)).toThrow(TaskNotFoundError);
        expect(repo.list()).toEqual(before);
      }),
    );
  });

  it('eliminar todas las tareas en cualquier orden deja el repositorio vacío', () => {
    const inputsWithOrderArb = fc.array(createInputArb, { maxLength: 20 }).chain((inputs) => {
      const indices = inputs.map((_, i) => i);
      return fc.tuple(
        fc.constant(inputs),
        fc.shuffledSubarray(indices, { minLength: indices.length, maxLength: indices.length }),
      );
    });

    fc.assert(
      fc.property(inputsWithOrderArb, ([inputs, order]) => {
        const { repo, tasks } = repositoryWith(inputs);

        for (const i of order) {
          repo.delete(tasks[i]!.id);
        }

        expect(repo.list()).toEqual([]);
      }),
    );
  });
});
