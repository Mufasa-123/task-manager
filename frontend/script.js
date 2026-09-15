const API_BASE = '/api';

const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('taskModal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('taskForm');

let currentFilter = '';
let tasks = [];

async function fetchTasks() {
  try {
    const url = currentFilter ? `${API_BASE}/tasks?status=${currentFilter}` : `${API_BASE}/tasks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    taskList.innerHTML = '';
    emptyState.textContent = 'Could not load tasks. Is the backend running?';
    taskList.appendChild(emptyState);
    console.error(err);
  }
}

function renderTasks() {
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    emptyState.textContent = 'No tasks found. Create one to get started.';
    taskList.appendChild(emptyState);
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.priority = task.priority;

    const due = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';

    card.innerHTML = `
      <div class="task-main">
        <p class="task-title ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)}</p>
        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="badge">${task.status.replace('_', ' ')}</span>
          <span class="badge">${task.priority}</span>
          <span>${due}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
        <button class="icon-btn" data-action="delete" data-id="${task.id}" title="Delete">🗑️</button>
      </div>
    `;
    taskList.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openModal(task = null) {
  form.reset();
  document.getElementById('taskId').value = task ? task.id : '';
  modalTitle.textContent = task ? 'Edit Task' : 'New Task';
  if (task) {
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description || '';
    document.getElementById('status').value = task.status;
    document.getElementById('priority').value = task.priority;
    document.getElementById('due_date').value = task.due_date ? task.due_date.split('T')[0] : '';
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

async function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const payload = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    status: document.getElementById('status').value,
    priority: document.getElementById('priority').value,
    due_date: document.getElementById('due_date').value || null,
  };

  try {
    const res = await fetch(id ? `${API_BASE}/tasks/${id}` : `${API_BASE}/tasks`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Save failed');
    closeModal();
    await fetchTasks();
  } catch (err) {
    alert('Could not save task.');
    console.error(err);
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Delete failed');
    await fetchTasks();
  } catch (err) {
    alert('Could not delete task.');
    console.error(err);
  }
}

taskList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit') {
    const task = tasks.find((t) => String(t.id) === id);
    openModal(task);
  } else if (btn.dataset.action === 'delete') {
    deleteTask(id);
  }
});

document.getElementById('newTaskBtn').addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', closeModal);
form.addEventListener('submit', saveTask);

document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    fetchTasks();
  });
});

fetchTasks();