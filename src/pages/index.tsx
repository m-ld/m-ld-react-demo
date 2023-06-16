import classNames from "classnames";
import { ChangeEvent, useState } from "react";
import { QueryResult } from "../QueryResult";
import { PropertyTypes } from "./_app";
import { uuid } from "@m-ld/m-ld";

enum StatusFilter {
  All = "all",
  Active = "active",
  Completed = "completed",
}

const CONTEXT = {
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
};

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
    "@type": "icaltzd:Vtodo",
    status: "?",
    summary: "?",
  } as const;

  const data = {
    "urn:uuid:db2ccffd-1b37-4ca4-81b9-d724dfb70ba8": {
      "@context": query["@context"],
      "@id": "urn:uuid:db2ccffd-1b37-4ca4-81b9-d724dfb70ba8",
      "@type": "icaltzd:Vtodo",
      status: "COMPLETED",
      summary: "Taste JavaScript",
    } satisfies QueryResult<typeof query>,
    "urn:uuid:401bfc3d-7c9b-46cc-a842-6d7c91bfd7ec": {
      "@context": query["@context"],
      "@id": "urn:uuid:401bfc3d-7c9b-46cc-a842-6d7c91bfd7ec",
      "@type": "icaltzd:Vtodo",
      status: "IN-PROCESS",
      summary: "Buy Unicorn",
    } satisfies QueryResult<typeof query>,
  }[id];

  if (!data) return <></>;

  const completed = data.status === "COMPLETED";

  const toggleCompleted = () => {
    write({
      "@context": query["@context"],
      "@id": id,
      status: { "@update": completed ? "IN-PROCESS" : "COMPLETED" },
    });
  };

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
          onChange={toggleCompleted}
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

const Header = () => {
  const [newTodoSummary, setNewTodoSummary] = useState("");

  const addTodo = () => {
    const uid = uuid();

    write({
      "@context": CONTEXT,
      "@id": "todoMVCList",
      items: {
        "@append": {
          "@id": `urn:uuid:${uid}`,
          "@type": "icaltzd:Vtodo",
          status: "COMPLETED",
          summary: "Taste JavaScript",
          uid,
        },
      },
    });
  };

  return (
    <header className="header">
      <h1>todos</h1>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        value={newTodoSummary}
        onChange={(e) => setNewTodoSummary(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addTodo();
          }
        }}
        autoFocus={true}
      />
    </header>
  );
};

export default function Home() {
  const [nowShowing, setNowShowing] = useState(StatusFilter.All);

  const query = {
    "@context": CONTEXT,
    "@id": "todoMVCList",
    items: [
      {
        "@id": "?",
        "@type": "icaltzd:Vtodo",
        status: (
          {
            [StatusFilter.All]: "?",
            [StatusFilter.Active]: "IN-PROCESS",
            [StatusFilter.Completed]: "COMPLETED",
          } as const
        )[nowShowing],
      },
    ],
    activeItems: {
      "@where": {
        "@type": "icaltzd:Vtodo",
        status: "IN-PROCESS",
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
  } as const;

  const data = {
    "@context": query["@context"],
    "@id": "todoMVCList",
    items: [
      {
        "@id": "urn:uuid:db2ccffd-1b37-4ca4-81b9-d724dfb70ba8",
        "@type": "icaltzd:Vtodo",
        status: "COMPLETED",
      },
      {
        "@id": "urn:uuid:401bfc3d-7c9b-46cc-a842-6d7c91bfd7ec",
        "@type": "icaltzd:Vtodo",
        status: "IN-PROCESS",
      },
    ],
    activeItems: {
      "@where": {
        "@type": "icaltzd:Vtodo",
        status: "IN-PROCESS",
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
  } satisfies QueryResult<typeof query, PropertyTypes>;

  const activeTodoCount = data.activeItems["@count"];
  const completedCount = data.completedItems["@count"];
  const shownTodos = data.items;

  const toggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    write({
      "@context": query["@context"],
      "@id": shownTodos.map((todo) => todo["@id"]),
      status: { "@update": e.target.checked ? "COMPLETED" : "IN-PROCESS" },
    });
  };

  return (
    <div>
      <Header />
      {!!data.items.length && (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            onChange={toggleAll}
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
          // onClearCompleted={(e) => this.clearCompleted()}
        />
      )}
    </div>
  );
}
