import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950 text-zinc-50 font-sans">
      <div className="w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 tracking-tight text-white">Todos List</h1>
        <ul className="space-y-3">
          {todos && todos.length > 0 ? (
            todos.map((todo) => (
              <li 
                key={todo.id} 
                className="flex items-center gap-3 p-4 bg-zinc-850 border border-zinc-800/60 rounded-xl hover:border-zinc-700/80 transition-all duration-200"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-200 font-medium">{todo.name}</span>
              </li>
            ))
          ) : (
            <p className="text-zinc-400 text-sm text-center py-4">No todos found or database is empty.</p>
          )}
        </ul>
      </div>
    </div>
  )
}
