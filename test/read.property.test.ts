import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TaskNotFoundError } from '../src/errors.js';
import { createInputArb, idArb } from './arbitraries.js';
import { repositoryWith } from './helpers.js';

const inputsArb = fc.array(createInputArb, { maxLength: 30 });

describe('Read', () => {
  it('obtener por id cualquier tarea creada devuelve exactamente la tarea creada', () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const { repo, tasks } = repositoryWith(inputs);

        for (const task of tasks) {
          expect(repo.getById(task.id)).toEqual(task);
        }
      }),
    );
  });

  it('el listado contiene exactamente las tareas creadas', () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const { repo, tasks } = repositoryWith(inputs);

        const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

        expect(repo.list().sort(byId)).toEqual([...tasks].sort(byId));
      }),
    );
  });

  it('obtener por un id inexistente lanza TaskNotFoundError', () => {
    fc.assert(
      fc.property(inputsArb, idArb, (inputs, id) => {
        const { repo, tasks } = repositoryWith(inputs);
        fc.pre(tasks.every((task) => task.id !== id));

        expect(() => repo.getById(id)).toThrow(TaskNotFoundError);
      }),
    );
  });

  it('leer no modifica el estado, aunque se alteren los objetos devueltos', () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const { repo } = repositoryWith(inputs);
        const before = repo.list();

        for (const task of repo.list()) {
          Object.assign(repo.getById(task.id), { title: 'changed', status: 'done' });
          Object.assign(task, { title: 'changed', status: 'done' });
        }

        expect(repo.list()).toEqual(before);
      }),
    );
  });
});
