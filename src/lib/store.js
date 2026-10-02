import { isSupabaseEnabled, supabase } from './supabase'
import { fileToDataUrl } from './compress'
import { MALE_EMAIL } from './avatarParts'

const LOCAL_KEYS = {
  relationship: 'dday_relationship',
  records: 'dday_records',
  todos: 'dday_todos',
  comments: 'dday_comments',
  books: 'dday_books',
  bookReviews: 'dday_book_reviews',
  avatars: 'dday_avatars',
}

const SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7일

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid() {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// relationship (사귄 날짜, 단일 row)
// ---------------------------------------------------------------------------

export async function getRelationship() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from('relationship')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data ? { id: data.id, startDate: data.start_date } : null
  }
  return readLocal(LOCAL_KEYS.relationship, null)
}

export async function setStartDate(dateStr) {
  if (isSupabaseEnabled) {
    const existing = await getRelationship()
    if (existing) {
      const { error } = await supabase
        .from('relationship')
        .update({ start_date: dateStr, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('relationship').insert({ start_date: dateStr })
      if (error) throw error
    }
    return
  }
  writeLocal(LOCAL_KEYS.relationship, { startDate: dateStr })
}

// ---------------------------------------------------------------------------
// date records (캘린더 데이트 기록)
// ---------------------------------------------------------------------------

async function resolvePhotoUrl(photoPath) {
  if (!photoPath) return null
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(photoPath, SIGNED_URL_TTL)
  if (error) {
    console.error('사진 URL 생성 실패:', error)
    return null
  }
  return data.signedUrl
}

export async function listDateRecords() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from('date_records')
      .select('*')
      .order('date', { ascending: true })
    if (error) throw error
    const records = await Promise.all(
      data.map(async (r) => ({
        id: r.id,
        date: r.date,
        title: r.title,
        memo: r.memo,
        photoUrl: await resolvePhotoUrl(r.photo_path),
        createdBy: r.created_by,
        createdAt: r.created_at,
        userId: r.user_id,
      }))
    )
    return records
  }
  const records = readLocal(LOCAL_KEYS.records, [])
  return records.sort((a, b) => (a.date < b.date ? -1 : 1))
}

/**
 * @param {object} record { id?, date, title, memo, photoFile?, createdBy, userId? }
 * photoFile: 압축된 File 객체 (선택). 없으면 기존 사진 유지.
 * userId: 새로 만드는 글일 때만 사용 (소유권, auth.uid()). 수정 시에는 바꾸지 않음.
 */
export async function upsertDateRecord(record) {
  const { id, date, title, memo, photoFile, createdBy, userId } = record

  if (isSupabaseEnabled) {
    let photoPath
    if (photoFile) {
      const path = `${date}/${uid()}-${photoFile.name || 'photo.jpg'}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, photoFile, { upsert: false })
      if (uploadError) throw uploadError
      photoPath = path
    }

    const payload = { date, title, memo, created_by: createdBy }
    if (photoPath) payload.photo_path = photoPath

    if (id) {
      const { error } = await supabase.from('date_records').update(payload).eq('id', id)
      if (error) throw error
      return id
    }
    let { data, error } = await supabase
      .from('date_records')
      .insert({ ...payload, user_id: userId })
      .select('id')
      .single()
    if (error?.code === '42703') {
      // migration_003 실행 전(user_id 컬럼 없음) — 예전처럼 user_id 없이 저장.
      ;({ data, error } = await supabase
        .from('date_records')
        .insert(payload)
        .select('id')
        .single())
    }
    if (error) throw error
    return data.id
  }

  const records = readLocal(LOCAL_KEYS.records, [])
  let photoUrl
  if (photoFile) {
    photoUrl = await fileToDataUrl(photoFile)
  }

  if (id) {
    const idx = records.findIndex((r) => r.id === id)
    if (idx >= 0) {
      records[idx] = {
        ...records[idx],
        date,
        title,
        memo,
        createdBy,
        ...(photoUrl ? { photoUrl } : {}),
      }
    }
    writeLocal(LOCAL_KEYS.records, records)
    return id
  }

  const newId = uid()
  records.push({
    id: newId,
    date,
    title,
    memo,
    photoUrl: photoUrl || null,
    createdBy,
    userId,
    createdAt: new Date().toISOString(),
  })
  writeLocal(LOCAL_KEYS.records, records)
  return newId
}

export async function deleteDateRecord(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('date_records').delete().eq('id', id)
    if (error) throw error
    return
  }
  const records = readLocal(LOCAL_KEYS.records, [])
  writeLocal(
    LOCAL_KEYS.records,
    records.filter((r) => r.id !== id)
  )
  // 로컬 모드는 FK cascade가 없어서 댓글도 같이 지워줌 (게시글 삭제 시 댓글도 함께 삭제).
  const comments = readLocal(LOCAL_KEYS.comments, [])
  writeLocal(
    LOCAL_KEYS.comments,
    comments.filter((c) => c.recordId !== id)
  )
}

// ---------------------------------------------------------------------------
// comments (게시글 댓글)
// ---------------------------------------------------------------------------

// migration_003_comments.sql 실행 전에는 comments 테이블이 없어서 에러가 남
// (PostgREST는 이를 "PGRST205"로, raw Postgres는 "42P01"로 보고함 — 환경에
// 따라 다를 수 있어 둘 다 체크) — 그 경우엔 에러 대신 빈 배열로 취급해서
// 나머지 화면(달력/글 목록/사진)은 평소처럼 쓸 수 있게 함.
const TABLE_MISSING_CODES = ['PGRST205', '42P01']
const isTableMissing = (error) => TABLE_MISSING_CODES.includes(error?.code)

export async function listComments(recordId) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: true })
    if (error) {
      if (isTableMissing(error)) return []
      throw error
    }
    return data.map((c) => ({
      id: c.id,
      recordId: c.record_id,
      userId: c.user_id,
      createdBy: c.created_by,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }))
  }
  const all = readLocal(LOCAL_KEYS.comments, [])
  return all
    .filter((c) => c.recordId === recordId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

/** 모든 기록의 댓글을 한 번에 가져옴 (달력 목록의 댓글 개수 표시용) */
export async function listAllComments() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from('comments').select('id, record_id')
    if (error) {
      if (isTableMissing(error)) return []
      throw error
    }
    return data.map((c) => ({ id: c.id, recordId: c.record_id }))
  }
  const all = readLocal(LOCAL_KEYS.comments, [])
  return all.map((c) => ({ id: c.id, recordId: c.recordId }))
}

export async function addComment({ recordId, content, createdBy, userId }) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from('comments')
      .insert({ record_id: recordId, content, created_by: createdBy, user_id: userId })
    if (error) throw error
    return
  }
  const all = readLocal(LOCAL_KEYS.comments, [])
  const now = new Date().toISOString()
  all.push({
    id: uid(),
    recordId,
    userId,
    createdBy,
    content,
    createdAt: now,
    updatedAt: now,
  })
  writeLocal(LOCAL_KEYS.comments, all)
}

export async function updateComment(id, content) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return
  }
  const all = readLocal(LOCAL_KEYS.comments, [])
  const idx = all.findIndex((c) => c.id === id)
  if (idx >= 0) {
    all[idx].content = content
    all[idx].updatedAt = new Date().toISOString()
    writeLocal(LOCAL_KEYS.comments, all)
  }
}

export async function deleteComment(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) throw error
    return
  }
  const all = readLocal(LOCAL_KEYS.comments, [])
  writeLocal(
    LOCAL_KEYS.comments,
    all.filter((c) => c.id !== id)
  )
}

// ---------------------------------------------------------------------------
// todos (공유 투두리스트)
// ---------------------------------------------------------------------------

export async function listTodos() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((t) => ({
      id: t.id,
      content: t.content,
      done: t.done,
      createdBy: t.created_by,
      createdAt: t.created_at,
    }))
  }
  const todos = readLocal(LOCAL_KEYS.todos, [])
  return [...todos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function addTodo({ content, createdBy }) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('todos').insert({ content, created_by: createdBy })
    if (error) throw error
    return
  }
  const todos = readLocal(LOCAL_KEYS.todos, [])
  todos.push({
    id: uid(),
    content,
    done: false,
    createdBy,
    createdAt: new Date().toISOString(),
  })
  writeLocal(LOCAL_KEYS.todos, todos)
}

export async function toggleTodo(id, done) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('todos').update({ done }).eq('id', id)
    if (error) throw error
    return
  }
  const todos = readLocal(LOCAL_KEYS.todos, [])
  const idx = todos.findIndex((t) => t.id === id)
  if (idx >= 0) {
    todos[idx].done = done
    writeLocal(LOCAL_KEYS.todos, todos)
  }
}

export async function deleteTodo(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) throw error
    return
  }
  const todos = readLocal(LOCAL_KEYS.todos, [])
  writeLocal(
    LOCAL_KEYS.todos,
    todos.filter((t) => t.id !== id)
  )
}

// ---------------------------------------------------------------------------
// books (북클럽 — 둘 다 추가/수정/삭제 가능, 소유자 제한 없음)
// ---------------------------------------------------------------------------

async function resolveBookCoverUrl(coverPath) {
  if (!coverPath) return null
  const { data, error } = await supabase.storage
    .from('book-covers')
    .createSignedUrl(coverPath, SIGNED_URL_TTL)
  if (error) {
    console.error('표지 URL 생성 실패:', error)
    return null
  }
  return data.signedUrl
}

export async function listBooks() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      if (isTableMissing(error)) return []
      throw error
    }
    return Promise.all(
      data.map(async (b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        status: b.status,
        coverUrl: await resolveBookCoverUrl(b.cover_path),
        createdBy: b.created_by,
        createdAt: b.created_at,
        userId: b.user_id,
      }))
    )
  }
  const books = readLocal(LOCAL_KEYS.books, [])
  return [...books].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/**
 * @param {object} book { title, author, status, coverFile?, createdBy, userId }
 */
export async function addBook(book) {
  const { title, author, status, coverFile, createdBy, userId } = book

  if (isSupabaseEnabled) {
    let coverPath
    if (coverFile) {
      const path = `${uid()}-${coverFile.name || 'cover.jpg'}`
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(path, coverFile, { upsert: false })
      if (uploadError) throw uploadError
      coverPath = path
    }
    const { error } = await supabase.from('books').insert({
      title,
      author,
      status,
      cover_path: coverPath,
      created_by: createdBy,
      user_id: userId,
    })
    if (error) throw error
    return
  }

  const books = readLocal(LOCAL_KEYS.books, [])
  let coverUrl = null
  if (coverFile) coverUrl = await fileToDataUrl(coverFile)
  books.push({
    id: uid(),
    title,
    author,
    status,
    coverUrl,
    createdBy,
    userId,
    createdAt: new Date().toISOString(),
  })
  writeLocal(LOCAL_KEYS.books, books)
}

/**
 * @param {string} id
 * @param {object} patch { title, author, status, coverFile? }
 * coverFile 없으면 기존 표지 유지.
 */
export async function updateBook(id, patch) {
  const { title, author, status, coverFile } = patch

  if (isSupabaseEnabled) {
    let coverPath
    if (coverFile) {
      const path = `${uid()}-${coverFile.name || 'cover.jpg'}`
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(path, coverFile, { upsert: false })
      if (uploadError) throw uploadError
      coverPath = path
    }
    const payload = { title, author, status }
    if (coverPath) payload.cover_path = coverPath
    const { error } = await supabase.from('books').update(payload).eq('id', id)
    if (error) throw error
    return
  }

  const books = readLocal(LOCAL_KEYS.books, [])
  const idx = books.findIndex((b) => b.id === id)
  if (idx >= 0) {
    let coverUrl
    if (coverFile) coverUrl = await fileToDataUrl(coverFile)
    books[idx] = {
      ...books[idx],
      title,
      author,
      status,
      ...(coverUrl ? { coverUrl } : {}),
    }
    writeLocal(LOCAL_KEYS.books, books)
  }
}

export async function deleteBook(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) throw error
    return
  }
  const books = readLocal(LOCAL_KEYS.books, [])
  writeLocal(
    LOCAL_KEYS.books,
    books.filter((b) => b.id !== id)
  )
  // 로컬 모드는 FK cascade가 없어서 한줄평도 같이 지워줌 (책 삭제 시 한줄평도 함께 삭제).
  const reviews = readLocal(LOCAL_KEYS.bookReviews, [])
  writeLocal(
    LOCAL_KEYS.bookReviews,
    reviews.filter((r) => r.bookId !== id)
  )
}

// ---------------------------------------------------------------------------
// book reviews (북클럽 한줄평 — 한 사람당 책 1권에 1개, 본인만 수정/삭제)
// ---------------------------------------------------------------------------

export async function listBookReviews(bookId) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from('book_reviews')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true })
    if (error) {
      if (isTableMissing(error)) return []
      throw error
    }
    return data.map((r) => ({
      id: r.id,
      bookId: r.book_id,
      userId: r.user_id,
      createdBy: r.created_by,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }
  const all = readLocal(LOCAL_KEYS.bookReviews, [])
  return all
    .filter((r) => r.bookId === bookId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

/** 모든 책의 한줄평을 한 번에 가져옴 (목록의 💬N 표시용) */
export async function listAllBookReviews() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from('book_reviews').select('id, book_id')
    if (error) {
      if (isTableMissing(error)) return []
      throw error
    }
    return data.map((r) => ({ id: r.id, bookId: r.book_id }))
  }
  const all = readLocal(LOCAL_KEYS.bookReviews, [])
  return all.map((r) => ({ id: r.id, bookId: r.bookId }))
}

export async function addBookReview({ bookId, content, createdBy, userId }) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from('book_reviews')
      .insert({ book_id: bookId, content, created_by: createdBy, user_id: userId })
    if (error) throw error
    return
  }
  const all = readLocal(LOCAL_KEYS.bookReviews, [])
  const now = new Date().toISOString()
  all.push({
    id: uid(),
    bookId,
    userId,
    createdBy,
    content,
    createdAt: now,
    updatedAt: now,
  })
  writeLocal(LOCAL_KEYS.bookReviews, all)
}

export async function updateBookReview(id, content) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from('book_reviews')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return
  }
  const all = readLocal(LOCAL_KEYS.bookReviews, [])
  const idx = all.findIndex((r) => r.id === id)
  if (idx >= 0) {
    all[idx].content = content
    all[idx].updatedAt = new Date().toISOString()
    writeLocal(LOCAL_KEYS.bookReviews, all)
  }
}

export async function deleteBookReview(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('book_reviews').delete().eq('id', id)
    if (error) throw error
    return
  }
  const all = readLocal(LOCAL_KEYS.bookReviews, [])
  writeLocal(
    LOCAL_KEYS.bookReviews,
    all.filter((r) => r.id !== id)
  )
}

// ---------------------------------------------------------------------------
// avatars (홈 화면 커플 캐릭터 꾸미기 — 본인 것만 수정 가능)
// 로컬(개발) 모드는 실제 두 사람 이메일이 없어서, 로컬 테스터는 항상 "남성 캐릭터"
// 슬롯(email=MALE_EMAIL)을 꾸미는 것으로 고정함 (Home.jsx가 email로 캐릭터를 매칭함).
// ---------------------------------------------------------------------------

export async function listAvatars() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from('avatars').select('*')
    if (error) {
      if (isTableMissing(error)) return []
      throw error
    }
    return data.map((a) => ({
      userId: a.user_id,
      email: a.email,
      displayName: a.display_name,
      hair: a.hair,
      hairColor: a.hair_color,
      top: a.top,
      topColor: a.top_color,
      bottom: a.bottom,
      bottomColor: a.bottom_color,
      shoes: a.shoes,
      shoesColor: a.shoes_color,
    }))
  }
  return readLocal(LOCAL_KEYS.avatars, [])
}

/**
 * @param {object} avatar { userId, email?, displayName, hair, hairColor, top, topColor,
 *   bottom, bottomColor, shoes, shoesColor }
 * email 생략 시(로컬 모드) MALE_EMAIL로 고정 저장.
 */
export async function saveAvatar(avatar) {
  const {
    userId,
    email = MALE_EMAIL,
    displayName,
    hair,
    hairColor,
    top,
    topColor,
    bottom,
    bottomColor,
    shoes,
    shoesColor,
  } = avatar

  if (isSupabaseEnabled) {
    const { error } = await supabase.from('avatars').upsert(
      {
        user_id: userId,
        email,
        display_name: displayName,
        hair,
        hair_color: hairColor,
        top,
        top_color: topColor,
        bottom,
        bottom_color: bottomColor,
        shoes,
        shoes_color: shoesColor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) throw error
    return
  }

  const all = readLocal(LOCAL_KEYS.avatars, [])
  const record = {
    userId,
    email,
    displayName,
    hair,
    hairColor,
    top,
    topColor,
    bottom,
    bottomColor,
    shoes,
    shoesColor,
  }
  const idx = all.findIndex((a) => a.userId === userId)
  if (idx >= 0) all[idx] = record
  else all.push(record)
  writeLocal(LOCAL_KEYS.avatars, all)
}

// ---------------------------------------------------------------------------
// realtime: 상대방이 추가/수정/삭제하면 콜백을 호출해서 화면을 새로고침 없이 갱신
// (localStorage 모드는 이 기기 하나뿐이라 구독할 게 없음 -> no-op)
// ---------------------------------------------------------------------------

export function subscribeToChanges(onChange) {
  if (!isSupabaseEnabled) return () => {}

  // 채널 이름이 겹치면 "같은 화면에 동시에 열린 두 구독"(예: 달력 + 그 위에 뜬
  // 보기 팝업)이 같은 채널 인스턴스를 공유하게 되어, 이미 subscribe()된 채널에
  // .on()을 또 거는 꼴이 되어 에러가 남 — 호출마다 고유한 채널 이름을 씀.
  const channel = supabase
    .channel(`dday-shared-data-${uid()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'relationship' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'date_records' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'book_reviews' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'avatars' }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
