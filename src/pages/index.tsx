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

const TodoItem = (props: ITodoItemProps) => {
  return (
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
};

interface ITodoFooterProps {
  completedCount: number;
  onClearCompleted: any;
  nowShowing: string;
  count: number;
}

const TodoFooter = (props: ITodoFooterProps) => {
  var activeTodoWord = props.count == 1 ? "item" : "items";
  var clearButton = null;

  if (props.completedCount > 0) {
    clearButton = (
      <button className="clear-completed" onClick={props.onClearCompleted}>
        Clear completed
      </button>
    );
  }

  const nowShowing = props.nowShowing;
  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{props.count}</strong> {activeTodoWord} left
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
      {clearButton}
    </footer>
  );
};

export default function Home() {
  const nowShowing: string = ACTIVE_TODOS;

  var footer;
  var main;

  const todos = TODOS;

  var activeTodoCount = todos.reduce(function (accum, todo) {
    return todo.completed ? accum : accum + 1;
  }, 0);

  var completedCount = todos.length - activeTodoCount;

  if (activeTodoCount || completedCount) {
    footer = (
      <TodoFooter
        count={activeTodoCount}
        completedCount={completedCount}
        nowShowing={nowShowing}
        // onClearCompleted={(e) => this.clearCompleted()}
      />
    );
  }

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

  var todoItems = shownTodos.map((todo) => {
    return (
      <TodoItem
        key={todo.id}
        todo={todo}
        // onToggle={this.toggle.bind(this, todo)}
        // onDestroy={this.destroy.bind(this, todo)}
        // onEdit={this.edit.bind(this, todo)}
        // editing={this.state.editing === todo.id}
        // onSave={this.save.bind(this, todo)}
        // onCancel={(e) => this.cancel()}
      />
    );
  });

  if (todos.length) {
    main = (
      <section className="main">
        <input
          id="toggle-all"
          className="toggle-all"
          type="checkbox"
          // onChange={(e) => this.toggleAll(e)}
          checked={activeTodoCount === 0}
        />
        <label htmlFor="toggle-all">Mark all as complete</label>
        <ul className="todo-list">{todoItems}</ul>
      </section>
    );
  }

  return (
    <>
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
        {main}
        {footer}
      </div>
      {/* <MeldDebug /> */}
    </>
  );
}
