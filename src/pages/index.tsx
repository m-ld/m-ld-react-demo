import { useMeld } from "@/hooks/useMeld";
import { MeldReadState } from "@m-ld/m-ld";
import classNames from "classnames";
import { MouseEventHandler, useEffect, useState } from "react";
import { query as runQuery } from "xql";
import { z } from "zod";
import { sortBy } from "lodash-es";
import { compact } from "jsonld";

const ALL_TODOS = "all";
const ACTIVE_TODOS = "active";
const COMPLETED_TODOS = "completed";

// https://www.kanzaki.com/docs/ical/status.html
const VTodoStatusEnum = z.enum([
  "NEEDS-ACTION", //Indicates to-do needs action.
  "COMPLETED", //Indicates to-do completed.
  "IN-PROCESS", //Indicates to-do in process of
  "CANCELLED", //Indicates to-do was cancelled.
]);

const TodoSchema = z.object({
  id: z.string().url(),
  title: z.string(),
  status: VTodoStatusEnum,
  order: z.number(),
});

type ITodo = z.infer<typeof TodoSchema>;

interface ITodoItemProps {
  todo: ITodo;
  editing?: boolean;
}

const TodoItem = (props: ITodoItemProps) => {
  const meld = useMeld();

  return (
    <li
      className={classNames({
        completed: props.todo.status === "COMPLETED",
        editing: props.editing,
      })}
    >
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={props.todo.status === "COMPLETED"}
          onChange={(e) => {
            meld?.write({
              "@update": {
                "@id": props.todo.id,
                "http://www.w3.org/2002/12/cal/icaltzd#status": e.target.checked
                  ? "COMPLETED"
                  : "IN-PROCESS",
              },
            });
          }}
        />
        <label>{props.todo.title}</label>
        {/* <button className="destroy" onClick={props.onDestroy} /> */}
      </div>
      <input className="edit" />
    </li>
  );
};

interface ITodoFooterProps {
  completedCount: number;
  onClearCompleted: MouseEventHandler<HTMLButtonElement>;
  nowShowing: string;
  count: number;
}

const TodoFooter = ({
  completedCount,
  onClearCompleted,
  nowShowing,
  count,
}: ITodoFooterProps) => (
  <footer className="footer">
    <span className="todo-count">
      <strong>{count}</strong> {count == 1 ? "item" : "items"} left
    </span>
    <ul className="filters">
      <li>
        <a
          href="#/"
          className={classNames({ selected: nowShowing === ALL_TODOS })}
        >
          All
        </a>
      </li>{" "}
      <li>
        <a
          href="#/active"
          className={classNames({ selected: nowShowing === ACTIVE_TODOS })}
        >
          Active
        </a>
      </li>{" "}
      <li>
        <a
          href="#/completed"
          className={classNames({ selected: nowShowing === COMPLETED_TODOS })}
        >
          Completed
        </a>
      </li>
    </ul>
    {!!completedCount && (
      <button className="clear-completed" onClick={onClearCompleted}>
        Clear completed
      </button>
    )}
  </footer>
);

const query = {
  "@context": {
    icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
    todomvc: "https://todomvc.com/vocab/",

    id: "@id",
    title: "icaltzd:summary",
    status: "icaltzd:status",
    order: "todomvc:order",
  },
  "@id": "todoMVCList",
  "@type": "todomvc:TodoList",
  "todomvc:items": [
    {
      id: "?",
      title: "?",
      status: "?",
      order: "?",
    },
  ],
};

const QueryResultSchema = z.object({
  "todomvc:items": z.array(TodoSchema),
});

export default function Home() {
  const meld = useMeld();
  // TODO: Should support a loading state, rather than defaulting to `[]`.
  const [todos, setTodos] = useState<ITodo[]>([]);

  useEffect(() => {
    if (meld) {
      const doRead = async (state: MeldReadState) => {
        await runQuery(state, query).then((data) => {
          setTodos(
            sortBy(
              QueryResultSchema.parse(data)["todomvc:items"],
              (r) => r.order
            )
          );
        });
      };
      meld.read(doRead, (update, state) => {
        return doRead(state);
      });
    }
  }, [meld]);

  const nowShowing: string = ALL_TODOS;

  var activeTodoCount = todos.filter(
    (todo) => todo.status !== "COMPLETED"
  ).length;
  var completedCount = todos.length - activeTodoCount;

  var shownTodos = todos.filter((todo) => {
    switch (nowShowing) {
      case ACTIVE_TODOS:
        return !(todo.status === "COMPLETED");
      case COMPLETED_TODOS:
        return todo.status === "COMPLETED";
      default:
        return true;
    }
  });

  const [newTodoSummary, setNewTodoSummary] = useState("");

  return (
    <div>
      <header className="header">
        <h1>todos</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setNewTodoSummary("");
            if (newTodoSummary.length > 0) {
              meld?.write(
                await compact(
                  {
                    "@context": {
                      todomvc: "https://todomvc.com/vocab/",
                      icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
                      "icaltzd:Vtodo": {
                        "@context": {
                          "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
                        },
                      },
                    },
                    "@id": "todoMVCList",
                    "todomvc:items": [
                      {
                        "@type": "icaltzd:Vtodo",
                        status: "IN-PROCESS",
                        summary: newTodoSummary,
                        uid: crypto.randomUUID(),
                        "todomvc:order": todos.length,
                      },
                    ],
                  },
                  {}
                )
              );
            }
          }}
        >
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            value={newTodoSummary}
            onChange={(e) => setNewTodoSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setNewTodoSummary("");
              }
            }}
            autoFocus={true}
          />
        </form>
      </header>
      {!!todos.length && (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            onChange={(e) => {
              meld?.write({
                "@update": todos.map((todo) => ({
                  "@id": todo.id,
                  "http://www.w3.org/2002/12/cal/icaltzd#status": e.target
                    .checked
                    ? "COMPLETED"
                    : "IN-PROCESS",
                })),
              });
            }}
            checked={activeTodoCount === 0}
          />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul className="todo-list">
            {shownTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        </section>
      )}

      {!!(activeTodoCount || completedCount) && (
        <TodoFooter
          count={activeTodoCount}
          completedCount={completedCount}
          nowShowing={nowShowing}
          onClearCompleted={(e) => {
            meld?.write({
              "@delete": todos
                .filter((todo) => todo.status === "COMPLETED")
                .map((todo) => ({
                  "@id": todo.id,
                  "?": "?",
                })),
            });
          }}
        />
      )}
    </div>
  );
}
