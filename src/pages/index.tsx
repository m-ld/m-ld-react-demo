import { useSubject } from "@/hooks/useSubject";
import classNames from "classnames";

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

export default function Home() {
  const nowShowing: string = ALL_TODOS;

  const todos = TODOS;

  var activeTodoCount = todos.filter((todo) => todo.completed).length;
  var completedCount = todos.length - activeTodoCount;

  var shownTodos = todos.filter((todo) => {
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
