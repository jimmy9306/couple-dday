import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { addTodo, deleteTodo, listTodos, subscribeToChanges, toggleTodo } from '../lib/store'

export default function Todo() {
  const { authorName } = useAuth()
  const [todos, setTodos] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

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
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))
    await toggleTodo(todo.id, !todo.done)
  }

  const handleDelete = async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await deleteTodo(id)
  }

  return (
    <div className="pt-6">
      <h2 className="text-glow mb-4 text-lg font-bold text-love-700">같이 할 일</h2>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="할 일을 입력하세요"
          className="flex-1 rounded-xl border border-love-200 bg-white px-4 py-3 text-sm outline-none focus:border-love-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-love-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_10px_rgba(199,125,214,0.5)] disabled:opacity-50"
        >
          추가
        </button>
      </form>

      {loading ? (
        <p className="text-center text-sm text-love-400">불러오는 중...</p>
      ) : todos.length === 0 ? (
        <p className="text-center text-sm text-gray-400">아직 할 일이 없어요.</p>
      ) : (
        <ul className="frame-glow divide-y divide-love-100 overflow-hidden">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => handleToggle(todo)}
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                  todo.done
                    ? 'border-love-500 bg-love-500 text-white shadow-[0_0_8px_rgba(199,125,214,0.6)]'
                    : 'border-love-300 text-transparent'
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${
                    todo.done ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
                >
                  {todo.content}
                </p>
                {todo.createdBy && (
                  <p className="text-[11px] text-gray-300">{todo.createdBy}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="flex-shrink-0 text-sm text-gray-300"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
