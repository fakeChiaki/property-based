# property-based

Sistema de gestión de **tareas** (CRUD en memoria) validado mediante **pruebas basadas en propiedades** (Property-Based Testing) con TypeScript, [fast-check](https://fast-check.dev/) y [Vitest](https://vitest.dev/).

## Pruebas basadas en propiedades

En lugar de escribir casos concretos ("si creo la tarea *X*, obtengo *X*"), se definen **propiedades**: reglas que deben cumplirse **para cualquier entrada válida**. fast-check genera automáticamente cientos de entradas aleatorias por propiedad y, si encuentra una que la viola, la reduce (*shrinking*) al contraejemplo mínimo que reproduce el fallo.

## Dominio

Una tarea (`Task`) tiene la siguiente forma:

| Campo         | Tipo                                    |
| ------------- | --------------------------------------- |
| `id`          | `string` (UUID generado por el sistema) |
| `title`       | `string`                                |
| `description` | `string`                                |
| `status`      | `'pending' \| 'in_progress' \| 'done'`  |
| `priority`    | `'low' \| 'medium' \| 'high'`           |

### Reglas del dominio

- El título se almacena sin espacios al inicio ni al final, no puede quedar vacío y tiene un máximo de 100 caracteres.
- La descripción tiene un máximo de 500 caracteres; si se omite, queda como `''`.
- Toda tarea nueva comienza con estado `pending`; si se omite la prioridad, queda en `medium`.
- El estado y la prioridad deben pertenecer a los valores permitidos.
- El `id` es único e inmutable.
- Una actualización es parcial: solo modifica los campos indicados.
- Una operación inválida lanza un error y **no modifica el estado** del sistema.

### Operaciones

| Operación                | Resultado      | Errores                                 |
| ------------------------ | -------------- | --------------------------------------- |
| `create(input)`          | `Task` creada  | `ValidationError`                       |
| `getById(id)`            | `Task`         | `TaskNotFoundError`                     |
| `list()`                 | `Task[]`       | —                                       |
| `update(id, changes)`    | `Task` editada | `ValidationError`, `TaskNotFoundError`  |
| `delete(id)`             | `void`         | `TaskNotFoundError`                     |

El repositorio siempre devuelve copias, por lo que modificar un objeto retornado no altera el estado interno.

## Estructura

```
src/
  errors.ts            Errores del dominio
  task.ts              Modelo Task y reglas de validación
  task-repository.ts   Repositorio CRUD en memoria
test/
  arbitraries.ts       Generadores de datos (válidos e inválidos)
  helpers.ts           Utilidades compartidas por las pruebas
  create.property.test.ts
  read.property.test.ts
  update.property.test.ts
  delete.property.test.ts
```

## Ejecución

Requiere Node.js 22.12 o superior.

```bash
npm install
npm test
```

Otros scripts disponibles:

| Script               | Descripción                          |
| -------------------- | ------------------------------------ |
| `npm run test:watch` | Ejecuta las pruebas en modo watch    |
| `npm run typecheck`  | Verifica los tipos sin compilar      |
| `npm run build`      | Compila a `dist/`                    |

## Generadores

Definidos en `test/arbitraries.ts`. Cada regla del dominio tiene un generador de entradas válidas y otro de entradas inválidas, de modo que las propiedades cubren ambos lados del límite.

| Generador               | Produce                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `validTitleArb`         | Títulos válidos, con espacios, tabs o saltos de línea alrededor              |
| `invalidTitleArb`       | Títulos vacíos, solo con espacios o de más de 100 caracteres tras recortarlos |
| `validDescriptionArb`   | Descripciones de hasta 500 caracteres                                        |
| `invalidDescriptionArb` | Descripciones de más de 500 caracteres                                       |
| `statusArb`, `priorityArb` | Valores permitidos                                                        |
| `invalidStatusArb`, `invalidPriorityArb` | Textos fuera de los valores permitidos                      |
| `createInputArb`        | Entradas de creación válidas con campos opcionales presentes o ausentes      |
| `invalidCreateInputArb` | Entradas de creación con exactamente un campo inválido                       |
| `updateInputArb`        | Cambios parciales válidos con cualquier combinación de campos               |
| `invalidUpdateInputArb` | Cambios con un campo inválido                                                |
| `idArb`                 | UUID arbitrarios, usados como identificadores inexistentes                   |

## Propiedades

### Create

| # | Propiedad |
| - | --------- |
| 1 | Para cualquier entrada válida, la tarea creada refleja la entrada normalizada (título recortado, valores por defecto) y su estado es `pending`. |
| 2 | Crear N tareas válidas produce N tareas con identificadores únicos. |
| 3 | Para cualquier estado previo y cualquier entrada inválida, se lanza `ValidationError` y el estado no cambia. |

### Read

| # | Propiedad |
| - | --------- |
| 1 | Para cualquier tarea creada, `getById` devuelve exactamente la tarea creada. |
| 2 | `list` contiene exactamente las tareas creadas, sin importar el orden. |
| 3 | `getById` con un id inexistente lanza `TaskNotFoundError`. |
| 4 | Leer no modifica el estado, aunque se alteren los objetos devueltos. |

### Update

| # | Propiedad |
| - | --------- |
| 1 | Para cualquier tarea y cambios válidos, el resultado es la tarea previa con los cambios normalizados aplicados y el mismo `id`. |
| 2 | Actualizar una tarea no altera las demás ni la cantidad total. |
| 3 | Aplicar la misma actualización dos veces equivale a aplicarla una vez (idempotencia). |
| 4 | Cambios inválidos lanzan `ValidationError` y no modifican el estado. |
| 5 | Actualizar un id inexistente lanza `TaskNotFoundError` y no modifica el estado. |

### Delete

| # | Propiedad |
| - | --------- |
| 1 | Tras eliminar una tarea existente, ya no puede obtenerse y el total disminuye en uno. |
| 2 | Eliminar una tarea no altera las demás. |
| 3 | Eliminar dos veces la misma tarea lanza `TaskNotFoundError` la segunda vez. |
| 4 | Eliminar un id inexistente lanza `TaskNotFoundError` y no modifica el estado. |
| 5 | Eliminar todas las tareas en cualquier orden deja el repositorio vacío. |

## Validación de las propiedades

Para comprobar que las propiedades detectan errores reales, se introdujeron fallos deliberados en la implementación y se verificó que fast-check los encontrara y redujera a un contraejemplo mínimo:

| Fallo introducido                                   | Propiedades que fallaron | Contraejemplo mínimo                      |
| --------------------------------------------------- | ------------------------ | ----------------------------------------- |
| No recortar el título                               | Create 1 y 3             | `{"title":"! "}` y `{"title":" "}`        |
| `getById` devuelve la referencia interna            | Read 4                   | `[{"title":"!"}]`                         |
| `update` omite la validación                        | Update 1 y 4             | `{"title":"! "}` y `{"priority":""}`      |
| `delete` solo elimina si hay una única tarea        | Delete 1, 2, 3 y 5       | Repositorio con 2 tareas                  |
