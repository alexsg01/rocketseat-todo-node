const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const user = users.find(user => user.username === username)

  if (!user) {
    return response.status(404).json({ error: "User not exists!" })
  }

  request.user = user

  return next()

}

function checkExistsTodo(request, response, next) {
  const { id } = request.params
  const { user } = request

  const todoExists = user.todos.some(todo => todo.id === id)

  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found!" })
  }

  request.id = id

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userExists = users.some(user => user.username === username)

  if (userExists) {
    return response.status(400).json({
      error: "An user with that username already exists!"
    })
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser)

  return response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body

  const { user } = request

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(newTodo)

  return response.status(201).json(newTodo)

});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { title, deadline } = request.body

  const { user, id } = request

  const newTodos = user.todos.map(todo => {
    if (todo.id === id) {
      return {
        ...todo,
        title,
        deadline
      }
    }
    return todo
  })

  const todo = newTodos.find(todo => todo.id === id)

  user.todos = newTodos

  return response.json(todo)

});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user, id } = request

  const newTodos = user.todos.map(todo => {
    if (todo.id === id)
      todo.done = true
    return todo
  })

  const todo = newTodos.find(todo => todo.id === id)

  user.todos = newTodos



  return response.json(todo)

});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user, id } = request

  const todo = user.todos.find(todo => todo.id === id)

  user.todos.splice(todo, 1)

  return response.status(204).send()
});

module.exports = app;