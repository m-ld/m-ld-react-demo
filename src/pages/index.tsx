import { useMeld } from "@/hooks/useMeld";
import { Construct, MeldReadState } from "@m-ld/m-ld";
import classNames from "classnames";
import { compact } from "jsonld";
import { useEffect, useState } from "react";
import { useDeepCompareMemoize } from "use-deep-compare-effect";
import { toSparql } from "json-rql-sparql";
import { Algebra, Factory as SparqlFactory, translate } from "sparqlalgebrajs";
import { RdfDataFactory } from "rdf-data-factory";
import { Quad } from "@rdfjs/types";

const ALL_TODOS = "all";
const ACTIVE_TODOS = "active";
const COMPLETED_TODOS = "completed";
const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

interface ITodo {
  id: string;
  title: string;
  completed: boolean;
}

const TODOS: ITodo[] = [
  { id: "a", title: "Taste JavaScript", completed: true },
  { id: "b", title: "Buy Unicorn", completed: false },
];

interface ITodoItemProps {
  key: string;
  todo: ITodo;
  editing?: boolean;
  onSave: (val: any) => void;
  onDestroy: () => void;
  onEdit: () => void;
  onCancel: (event: any) => void;
  onToggle: () => void;
}

const TodoItem = (props: ITodoItemProps) => (
  <li
    className={classNames({
      completed: props.todo.completed,
      editing: props.editing,
    })}
  >
    <div className="view">
      <input
        className="toggle"
        type="checkbox"
        checked={props.todo.completed}
        onChange={props.onToggle}
      />
      <label
      // onDoubleClick={(e) => this.handleEdit()}
      >
        {props.todo.title}
      </label>
      <button className="destroy" onClick={props.onDestroy} />
    </div>
    <input
      className="edit"
      // value={this.state.editText}
      // onBlur={(e) => this.handleSubmit(e)}
      // onChange={(e) => this.handleChange(e)}
      // onKeyDown={(e) => this.handleKeyDown(e)}
    />
  </li>
);

interface ITodoFooterProps {
  completedCount: number;
  onClearCompleted: any;
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

function useQuery(query) {
  const meld = useMeld();
  const [data, setData] = useState<{}>();

  const memoQuery = useDeepCompareMemoize(query);

  // Deep compare the query, so that the client component can safely use an
  // object literal for the query, which will create a new (even if identical)
  // object on every render.
  useEffect(() => {
    if (!meld || !memoQuery) {
      setData(undefined);
    } else {
      const doRead = async (state: MeldReadState) => {
        // toSparql(
        //   {
        //     "@construct": [
        //       {
        //         "@id": "todoMVCList",
        //         // BOOKMARK: Why can't I query for ?a like this?
        //         // "http://todomvc.com/vocab/items": { "@id": "?a" },
        //       },
        //     ],
        //   },
        //   (err, sparql, parsed) => console.log("toSparql:", err, sparql, parsed)
        // );

        console.log(
          await state.read<Construct>({
            "@construct": [
              {
                "@id": "todoMVCList",
                // BOOKMARK: Why can't I query for ?a like this?
                // "http://todomvc.com/vocab/items": { "@id": "?a" },
              },
            ],
          })
        );

        console.log(
          translate(
            "CONSTRUCT { <ex:foo> a ?bar } WHERE { <ex:foo> a <ex:bar> }"
          )
        );

        const sparql = new SparqlFactory();

        const patterns = [
          sparql.createPattern(
            sparql.dataFactory.variable!("foo"),
            sparql.dataFactory.namedNode(
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            ),
            sparql.dataFactory.variable!("bar")
          ),
        ];

        const q: Algebra.Construct = sparql.createConstruct(
          sparql.createBgp(patterns),
          patterns
        );

        const quads: Quad[] = [];
        meld
          .query(q)
          .on("data", (quad) => {
            console.log(quad);
            quads.push(quad);
          })
          .on("end", () => {
            console.log(quads);
          });

        // const expandedQuery = await expand(memoQuery);
        // console.log(expandedQuery[0]);
        const compactedQuery = await compact(memoQuery, {});
        console.log(compactedQuery);
        const result = await state.read<Construct>({
          "@construct": compactedQuery,
        });
        console.log(result);
        const compactedResult = await compact(result, memoQuery["@context"]);
        setData(compactedResult);
      };

      const subscription = meld.read(doRead, async (_update, state) => {
        doRead(state);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [memoQuery, meld]);

  return data;
}

export default function Home() {
  const nowShowing: string = ALL_TODOS;

  const data = useQuery({
    "@context": {
      "@vocab": "http://todomvc.com/vocab/",
      ical: "http://www.w3.org/2002/12/cal/icaltzd#",
    },
    "@id": "todoMVCList",
    items: {
      "@id": "?a",
      "ical:status": "?b",
    },
  });

  if (!data) return;

  console.log(data);

  // const data = useSubject(items) ?? {};

  const todos: ITodo[] | undefined = data["@list"];
  console.log(todos);
  if (!todos) return;

  const activeTodoCount = todos.filter((todo) => todo.completed).length;
  const completedCount = todos.length - activeTodoCount;

  const shownTodos = todos.filter((todo) => {
    switch (nowShowing) {
      case ACTIVE_TODOS:
        return !todo.completed;
      case COMPLETED_TODOS:
        return todo.completed;
      default:
        return true;
    }
  });

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
      {!!todos.length && (
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
          // onClearCompleted={(e) => this.clearCompleted()}f
        />
      )}
    </div>
  );
}
