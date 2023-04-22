import classNames from "classnames";
import { useState } from "react";

enum StatusFilter {
  All = "all",
  Active = "active",
  Completed = "completed",
}

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

interface ITodo {
  id: string;
  title: string;
  completed: boolean;
}

interface ITodoItemProps {
  id: string;
  editing?: boolean;
  // onSave: (val: any) => void;
  // onDestroy: () => void;
  // onEdit: () => void;
  // onCancel: (event: any) => void;
  // onToggle: () => void;
}

const TodoItem = ({ id, editing }: ITodoItemProps) => {
  const query = {
    "@context": {
      "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
    },
    "@id": id,
    status: "?",
    summary: "?",
  };

  const data = {
    "urn:uuid:db2ccffd-1b37-4ca4-81b9-d724dfb70ba8": {
      "@context": query["@context"],
      "@id": "urn:uuid:db2ccffd-1b37-4ca4-81b9-d724dfb70ba8",
      "@type": "icaltzd:Vtodo",
      status: "COMPLETED",
      summary: "Taste JavaScript",
    },
    "urn:uuid:401bfc3d-7c9b-46cc-a842-6d7c91bfd7ec": {
      "@context": query["@context"],
      "@id": "urn:uuid:401bfc3d-7c9b-46cc-a842-6d7c91bfd7ec",
      "@type": "icaltzd:Vtodo",
      status: "IN-PROCESS",
      summary: "Buy Unicorn",
    },
  }[id];

  if (!data) return <></>;

  const completed = data.status === "COMPLETED";

  return (
    <li
      className={classNames({
        completed: completed,
        editing: editing,
      })}
    >
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={completed}
          // onChange={onToggle}
        />
        <label>{data.summary}</label>
        <button
          className="destroy"
          // onClick={onDestroy}
        />
      </div>
      <input className="edit" />
    </li>
  );
};

interface ITodoFooterProps {
  completedCount: number;
  // onClearCompleted: any;
  nowShowing: string;
  count: number;
}

const TodoFooter = ({
  completedCount,
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
          className={classNames({ selected: nowShowing === StatusFilter.All })}
        >
          All
        </a>
      </li>{" "}
      <li>
        <a
          href="#/active"
          className={classNames({
            selected: nowShowing === StatusFilter.Active,
          })}
        >
          Active
        </a>
      </li>{" "}
      <li>
        <a
          href="#/completed"
          className={classNames({
            selected: nowShowing === StatusFilter.Completed,
          })}
        >
          Completed
        </a>
      </li>
    </ul>
    {!!completedCount && (
      <button
        className="clear-completed"
        // onClick={onClearCompleted}
      >
        Clear completed
      </button>
    )}
  </footer>
);

export default function Home() {
  const [nowShowing, setNowShowing] = useState(StatusFilter.All);

  const query = {
    "@context": {
      "@vocab": "https://todomvc.com/vocab/",
      icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
      items: {
        "@container": "@list",
      },
      activeItems: "items",
      completedItems: "items",
      "icaltzd:Vtodo": {
        "@context": {
          "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
        },
      },
    },
    "@id": "todoMVCList",
    items: {
      "@id": "?",
      "@type": "icaltzd:Vtodo",
      ...(nowShowing !== StatusFilter.All && {
        status:
          nowShowing === StatusFilter.Completed ? "COMPLETED" : "IN-PROGRESS",
      }),
    },
    activeItems: {
      "@where": {
        "@type": "icaltzd:Vtodo",
        status: "IN-PROGRESS",
      },
      "@count": "?",
    },
    completedItems: {
      "@where": {
        "@type": "icaltzd:Vtodo",
        status: "COMPLETED",
      },
      "@count": "?",
    },
  };

  const data = {
    "@context": query["@context"],
    "@id": "todoMVCList",
    items: [
      {
        "@id": "urn:uuid:db2ccffd-1b37-4ca4-81b9-d724dfb70ba8",
        "@type": "icaltzd:Vtodo",
      },
      {
        "@id": "urn:uuid:401bfc3d-7c9b-46cc-a842-6d7c91bfd7ec",
        "@type": "icaltzd:Vtodo",
      },
    ],
    activeItems: {
      "@where": {
        "@type": "icaltzd:Vtodo",
        status: "IN-PROGRESS",
      },
      "@count": 1,
    },
    completedItems: {
      "@where": {
        "@type": "icaltzd:Vtodo",
        status: "COMPLETED",
      },
      "@count": 1,
    },
  };

  const activeTodoCount = data.activeItems["@count"];
  const completedCount = data.completedItems["@count"];
  const shownTodos = data.items;

  return (
    <div>
      <header className="header">
        <h1>todos</h1>
        <input
          className="new-todo"
          placeholder="What needs to be done?"
          // onKeyDown={(e) => this.handleNewTodoKeyDown(e)}
          autoFocus={true}
        />
      </header>
      {!!data.items.length && (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            // onChange={(e) => this.toggleAll(e)}
            checked={activeTodoCount === 0}
          />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul className="todo-list">
            {shownTodos.map((todo) => (
              <TodoItem key={todo["@id"]} id={todo["@id"]} />
            ))}
          </ul>
        </section>
      )}

      {!!(activeTodoCount || completedCount) && (
        <TodoFooter
          count={activeTodoCount}
          completedCount={completedCount}
          nowShowing={nowShowing}
          // onClearCompleted={(e) => this.clearCompleted()}f
        />
      )}
    </div>
  );
}
