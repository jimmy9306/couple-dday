import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { addTodo, deleteTodo, listTodos, subscribeToChanges, toggleTodo } from '../lib/store'
import PixelPanel from '../components/PixelPanel'
import { CheckIcon } from '../components/icons'

export default function Todo() {
  const { authorName } = useAuth()
  const [todos, setTodos] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [clearId, setClearId] = useState(null)

  const load = async () => {
    setTodos(await listTodos())
    setLoading(false)
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToChanges(() => load())
    return unsubscribe
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setBusy(true)
    try {
      await addTodo({ content: content.trim(), createdBy: authorName })
      setContent('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const handleToggle = async (todo) => {
    const willBeDone = !todo.done
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: willBeDone } : t)))
    if (willBeDone) {
      setClearId(todo.id)
      window.setTimeout(() => setClearId((cur) => (cur === todo.id ? null : cur)), 900)
    }
    await toggleTodo(todo.id, willBeDone)
  }

  const handleDelete = async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await deleteTodo(id)
  }

  return (
    <div className="pt-6">
      <h2 className="font-title mb-4 text-[14px] text-pastel-text">같이 할 일</h2>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="할 일을 입력하세요"
          className="font-body flex-1 border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="pixel-btn font-title border-2 border-pastel-border bg-pastel-accent px-4 py-2 text-[14px] text-pastel-text disabled:opacity-50"
        >
          추가
        </button>
      </form>

      {loading ? (
        <p className="font-body text-center text-[11px] text-pastel-text">불러오는 중...</p>
      ) : todos.length === 0 ? (
        <p className="font-body text-center text-[11px] text-pastel-text">아직 할 일이 없어요.</p>
      ) : (
        <PixelPanel innerClassName="">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="relative flex items-center gap-3 border-b-2 border-pastel-border px-4 py-3 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => handleToggle(todo)}
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-pastel-border ${
                  todo.done ? 'bg-pastel-accent' : 'bg-pastel-bg'
                }`}
              >
                {todo.done && <CheckIcon className="h-3.5 w-3.5 text-pastel-border" />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-body truncate text-[11px] ${
                    todo.done ? 'text-pastel-accent line-through' : 'text-pastel-text'
                  }`}
                >
                  {todo.content}
                </p>
                {todo.createdBy && (
                  <p className="font-body text-[11px] text-pastel-accent">{todo.createdBy}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="font-body flex-shrink-0 text-[11px] text-pastel-accent"
              >
                삭제
              </button>

              {clearId === todo.id && (
                <span className="pixel-clear-flash font-title pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-2 border-pastel-border bg-pastel-accent px-2 py-1 text-[11px] text-pastel-text">
                  CLEAR!
                </span>
              )}
            </div>
          ))}
        </PixelPanel>
      )}
    </div>
  )
}
