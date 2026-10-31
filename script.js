/**
 * TaskFlow 2.0 — Gerenciador de Tarefas
 * Arquitetura de Estado Unidirecional (State -> Storage -> Render)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constantes e Configurações
  // ==========================================================================
  const STORAGE_KEY = 'taskflow_tasks_v1'; // mesma chave da v1: dados antigos continuam valendo
  const THEME_KEY = 'taskflow_theme';
  const DEFAULT_CATEGORY = 'Geral';
  const SUGGESTED_CATEGORIES = ['Geral', 'Trabalho', 'Estudos', 'Pessoal', 'Saúde'];
  const UNDO_WINDOW_MS = 6000;
  const PRIORITIES = {
    high: { label: 'Alta', weight: 3 },
    medium: { label: 'Média', weight: 2 },
    low: { label: 'Baixa', weight: 1 }
  };

  const ICONS = {
    check: '<svg class="custom-checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'
  };

  // ==========================================================================
  // 2. Estado da Aplicação
  // ==========================================================================
  const state = {
    tasks: [],
    filter: 'all',      // 'all' | 'pending' | 'completed'
    priority: 'all',    // 'all' | 'high' | 'medium' | 'low'
    category: 'all',    // 'all' | nome da categoria
    search: '',
    sort: 'created',    // 'created' | 'due' | 'priority'
    editingId: null,
    highlightId: null
  };

  // ==========================================================================
  // 3. Elementos do DOM
  // ==========================================================================
  const byId = (id) => document.getElementById(id);
  const elements = {
    currentDateDisplay: byId('currentDateDisplay'),
    greeting: byId('greeting'),
    taskForm: byId('taskForm'),
    formTitle: byId('formTitle'),
    taskInput: byId('taskInput'),
    categoryInput: byId('categoryInput'),
    categoryList: byId('categoryList'),
    priorityInput: byId('priorityInput'),
    dueInput: byId('dueInput'),
    submitLabel: byId('submitLabel'),
    cancelEditBtn: byId('cancelEditBtn'),
    formFeedback: byId('formFeedback'),
    taskList: byId('taskList'),
    emptyState: byId('emptyState'),
    emptyStateTitle: byId('emptyStateTitle'),
    emptyStateDesc: byId('emptyStateDesc'),
    clearFiltersBtn: byId('clearFiltersBtn'),
    totalTasksCount: byId('totalTasksCount'),
    pendingTasksCount: byId('pendingTasksCount'),
    completedTasksCount: byId('completedTasksCount'),
    percentCount: byId('percentCount'),
    progressBar: byId('progressBar'),
    progressFill: byId('progressFill'),
    progressText: byId('progressText'),
    navItems: document.querySelectorAll('.nav-item'),
    badgeAll: byId('badgeAll'),
    badgePending: byId('badgePending'),
    badgeCompleted: byId('badgeCompleted'),
    searchInput: byId('searchInput'),
    priorityFilter: byId('priorityFilter'),
    categoryFilter: byId('categoryFilter'),
    sortSelect: byId('sortSelect'),
    themeToggle: byId('themeToggle'),
    toastRegion: byId('toastRegion'),
    quickHint: byId('quickHint'),
    palette: byId('commandPalette'),
    paletteInput: byId('paletteInput'),
    paletteList: byId('paletteList'),
    paletteBtn: byId('paletteBtn')
  };

  // ==========================================================================
  // 4. Persistência (LocalStorage)
  // ==========================================================================
  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('[TaskFlow] Erro ao gravar no localStorage:', error);
      return false;
    }
  }

  /**
   * Garante que qualquer tarefa (inclusive as da v1, só com id/text/completed/createdAt)
   * tenha todos os campos da v2. Retorna null para registros inválidos.
   */
  function normalizeTask(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const text = String(raw.text == null ? '' : raw.text).trim();
    if (!text) return null;

    return {
      id: raw.id ? String(raw.id) : generateUniqueId(),
      text,
      completed: Boolean(raw.completed),
      createdAt: isNaN(new Date(raw.createdAt).getTime()) ? new Date().toISOString() : raw.createdAt,
      category: cleanCategory(raw.category),
      priority: PRIORITIES[raw.priority] ? raw.priority : 'medium',
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate || '') ? raw.dueDate : null
    };
  }

  function loadTasksFromStorage() {
    try {
      const rawData = readStorage(STORAGE_KEY);
      if (!rawData) return [];
      const parsedData = JSON.parse(rawData);
      return Array.isArray(parsedData) ? parsedData.map(normalizeTask).filter(Boolean) : [];
    } catch (error) {
      console.error('[TaskFlow] Erro ao carregar tarefas do localStorage:', error);
      return [];
    }
  }

  function saveTasksToStorage() {
    if (!writeStorage(STORAGE_KEY, JSON.stringify(state.tasks))) {
      showFeedback('Não foi possível salvar os dados localmente. Espaço insuficiente ou modo privado restrito.');
    }
  }

  // ==========================================================================
  // 5. Utilitários
  // ==========================================================================
  function generateUniqueId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  }

  function cleanCategory(value) {
    return String(value || '').trim().slice(0, 24) || DEFAULT_CATEGORY;
  }

  /** Minúsculas e sem acentos, para pesquisa tolerante. */
  function fold(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function toDateString(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function getTodayString() {
    return toDateString(new Date());
  }

  function formatDueDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  function formatTaskDate(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `Criada em ${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function getDueInfo(task) {
    if (!task.dueDate) return null;
    const today = getTodayString();
    const overdue = !task.completed && task.dueDate < today;
    if (overdue) return { text: `Atrasada • ${formatDueDate(task.dueDate)}`, overdue };
    if (!task.completed && task.dueDate === today) return { text: 'Vence hoje', overdue: false };
    return { text: `Prazo ${formatDueDate(task.dueDate)}`, overdue: false };
  }

  // ==========================================================================
  // 5b. Entrada rápida (linguagem natural no título)
  // ==========================================================================
  const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const QUICK_DATE = /(^|\s)(depois de amanh[ãa]|amanh[ãa]|hoje|domingo|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|\d{1,2}\/\d{1,2})(?=\s|$)/i;

  function resolveQuickDate(word) {
    const key = fold(word);
    const date = new Date();
    date.setHours(12, 0, 0, 0);

    if (key.includes('/')) {
      const [day, month] = key.split('/').map(Number);
      const target = new Date(date.getFullYear(), month - 1, day, 12);
      if (target.getMonth() !== month - 1 || target.getDate() !== day) return null; // data inexistente
      if (toDateString(target) < getTodayString()) target.setFullYear(target.getFullYear() + 1);
      return toDateString(target);
    }

    let offset = { hoje: 0, amanha: 1, 'depois de amanha': 2 }[key];
    if (offset === undefined) offset = (WEEKDAYS.indexOf(key) - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + offset);
    return toDateString(date);
  }

  /**
   * Extrai #categoria, !prioridade e uma data do título.
   * Ex.: "Pagar conta amanhã #finanças !alta" -> título "Pagar conta".
   * Retorna sempre { text } e só inclui os campos que encontrou.
   */
  function parseQuickEntry(input) {
    const found = {};
    let text = input;

    text = text.replace(/(^|\s)#([\p{L}\d_]+)/u, (match, space, tag) => {
      found.category = cleanCategory(tag.charAt(0).toUpperCase() + tag.slice(1));
      return space;
    });

    text = text.replace(/(^|\s)!(alta|m[ée]dia|baixa)(?=\s|$)/iu, (match, space, level) => {
      found.priority = { alta: 'high', media: 'medium', baixa: 'low' }[fold(level)];
      return space;
    });

    text = text.replace(QUICK_DATE, (match, space, word) => {
      const date = resolveQuickDate(word);
      if (!date) return match;
      found.dueDate = date;
      return space;
    });

    text = text.replace(/\s{2,}/g, ' ').trim();
    // Se sobrar só o marcador (ex.: "amanhã"), mantém o texto original como título
    return text ? { ...found, text } : { text: input.trim() };
  }

  function displayHeader() {
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    elements.currentDateDisplay.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    elements.currentDateDisplay.dateTime = getTodayString();

    const hour = now.getHours();
    elements.greeting.textContent = hour < 12 ? 'Bom dia!' : hour < 18 ? 'Boa tarde!' : 'Boa noite!';
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // ==========================================================================
  // 6. Feedback (validação do formulário e avisos)
  // ==========================================================================
  let feedbackTimeout = null;
  let lastDeleted = null; // { task, index } da última exclusão, para desfazer
  let undoTimer = null;

  function showFeedback(message) {
    clearTimeout(feedbackTimeout);
    elements.formFeedback.textContent = message;
    elements.formFeedback.classList.add('visible');
    feedbackTimeout = setTimeout(clearFeedback, 3500);
  }

  function clearFeedback() {
    clearTimeout(feedbackTimeout);
    elements.formFeedback.classList.remove('visible');
    elements.formFeedback.textContent = '';
  }

  function showToast(message, type = 'success', action = null) {
    while (elements.toastRegion.children.length >= 3) elements.toastRegion.firstChild.remove();
    const toast = createElement('div', `toast toast-${type}`);
    toast.appendChild(createElement('span', '', message));
    if (action) {
      const button = createElement('button', 'toast-action', action.label);
      button.type = 'button';
      button.addEventListener('click', () => { toast.remove(); action.run(); });
      toast.appendChild(button);
    }
    elements.toastRegion.appendChild(toast);
    setTimeout(() => toast.remove(), action ? UNDO_WINDOW_MS : 3200);
  }

  // ==========================================================================
  // 7. Ações sobre o estado
  // ==========================================================================
  function readFormValues() {
    return {
      text: elements.taskInput.value.trim(),
      category: cleanCategory(elements.categoryInput.value),
      priority: PRIORITIES[elements.priorityInput.value] ? elements.priorityInput.value : 'medium',
      dueDate: elements.dueInput.value || null
    };
  }

  function submitTask() {
    let values = readFormValues();
    if (!state.editingId) values = { ...values, ...parseQuickEntry(values.text) };
    if (!values.text) {
      showFeedback('Por favor, informe o título da tarefa antes de salvar.');
      elements.taskInput.focus();
      return false;
    }
    return state.editingId ? updateTask(state.editingId, values) : addTask(values);
  }

  function addTask(values) {
    const newTask = { id: generateUniqueId(), ...values, completed: false, createdAt: new Date().toISOString() };
    state.tasks.unshift(newTask);
    state.highlightId = newTask.id;
    saveTasksToStorage();
    clearFeedback();
    showToast('Tarefa adicionada.');
    render();
    return true;
  }

  function updateTask(taskId, values) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return false;
    Object.assign(task, values);
    state.editingId = null;
    state.highlightId = taskId;
    saveTasksToStorage();
    clearFeedback();
    showToast('Tarefa atualizada.');
    render();
    return true;
  }

  function toggleTaskCompletion(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    saveTasksToStorage();
    showToast(task.completed ? 'Tarefa concluída. Bom trabalho!' : 'Tarefa reaberta.', 'info');
    render();
    focusTaskControl(taskId, '.custom-checkbox-input');
  }

  function deleteTask(taskId) {
    const position = getVisibleTasks().findIndex((item) => item.id === taskId);
    const index = state.tasks.findIndex((item) => item.id === taskId);
    if (index === -1) return;
    lastDeleted = { task: state.tasks[index], index };
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { lastDeleted = null; }, UNDO_WINDOW_MS);
    state.tasks.splice(index, 1);
    if (state.editingId === taskId) state.editingId = null;
    saveTasksToStorage();
    showToast('Tarefa excluída.', 'danger', { label: 'Desfazer', run: undoDelete });
    render();

    // Mantém o foco dentro da lista para quem navega pelo teclado
    const buttons = elements.taskList.querySelectorAll('.delete-task-btn');
    (buttons[Math.min(position, buttons.length - 1)] || elements.taskInput).focus();
  }

  function undoDelete() {
    if (!lastDeleted) return;
    const { task, index } = lastDeleted;
    lastDeleted = null;
    clearTimeout(undoTimer);
    state.tasks.splice(Math.min(index, state.tasks.length), 0, task);
    state.highlightId = task.id;
    saveTasksToStorage();
    showToast('Tarefa restaurada.', 'info');
    render();
  }

  function startEdit(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    state.editingId = taskId;
    elements.taskInput.value = task.text;
    elements.categoryInput.value = task.category;
    elements.priorityInput.value = task.priority;
    elements.dueInput.value = task.dueDate || '';
    clearFeedback();
    render();
    elements.taskForm.scrollIntoView({ block: 'nearest' });
    elements.taskInput.focus();
  }

  function cancelEdit() {
    state.editingId = null;
    elements.taskForm.reset();
    clearFeedback();
    render();
  }

  function focusTaskControl(taskId, selector) {
    const item = Array.from(elements.taskList.children).find((li) => li.dataset.taskId === taskId);
    const control = item && item.querySelector(selector);
    if (control) control.focus();
  }

  function setStatusFilter(newFilter) {
    if (state.filter === newFilter) return;
    state.filter = newFilter;
    render();
  }

  function clearSearchAndFilters() {
    state.search = '';
    state.priority = 'all';
    state.category = 'all';
    elements.searchInput.value = '';
    elements.priorityFilter.value = 'all';
    render();
  }

  // ==========================================================================
  // 8. Seleção e ordenação (lógica sem DOM)
  // ==========================================================================
  const byCreated = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  const byPriority = (a, b) => PRIORITIES[b.priority].weight - PRIORITIES[a.priority].weight;
  const byDue = (a, b) => {
    if (a.dueDate === b.dueDate) return 0;
    if (!a.dueDate) return 1;   // sem prazo vai para o fim
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  };
  const SORTERS = {
    created: byCreated,
    due: (a, b) => byDue(a, b) || byPriority(a, b) || byCreated(a, b),
    priority: (a, b) => byPriority(a, b) || byDue(a, b) || byCreated(a, b)
  };

  function hasActiveFilters() {
    return Boolean(state.search.trim()) || state.priority !== 'all' || state.category !== 'all';
  }

  function getVisibleTasks() {
    const query = fold(state.search.trim());
    return state.tasks
      .filter((task) => {
        if (state.filter === 'pending' && task.completed) return false;
        if (state.filter === 'completed' && !task.completed) return false;
        if (state.priority !== 'all' && task.priority !== state.priority) return false;
        if (state.category !== 'all' && task.category !== state.category) return false;
        return !query || fold(task.text).includes(query);
      })
      .sort(SORTERS[state.sort]);
  }

  // ==========================================================================
  // 9. Renderização
  // ==========================================================================
  function createTaskElement(task) {
    const li = createElement('li', 'task-item');
    li.dataset.taskId = task.id;
    li.classList.toggle('is-completed', task.completed);
    li.classList.toggle('is-new', task.id === state.highlightId);
    li.classList.toggle('is-editing', task.id === state.editingId);

    // Checkbox acessível
    const checkboxWrapper = createElement('label', 'custom-checkbox-wrapper');
    checkboxWrapper.title = task.completed ? 'Reabrir tarefa' : 'Marcar como concluída';
    const checkbox = createElement('input', 'custom-checkbox-input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `${task.completed ? 'Reabrir' : 'Concluir'} tarefa: ${task.text}`);
    const box = createElement('span', 'custom-checkbox-box');
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = ICONS.check;
    checkboxWrapper.append(checkbox, box);

    // Conteúdo e metadados
    const content = createElement('div', 'task-content');
    const meta = createElement('div', 'task-meta');
    meta.appendChild(createElement('span', 'chip chip-category', task.category));
    meta.appendChild(createElement('span', `chip chip-priority priority-${task.priority}`, `Prioridade ${PRIORITIES[task.priority].label.toLowerCase()}`));
    const due = getDueInfo(task);
    if (due) meta.appendChild(createElement('span', 'chip chip-due' + (due.overdue ? ' is-overdue' : ''), due.text));
    meta.appendChild(createElement('time', 'task-time', formatTaskDate(task.createdAt)));
    content.append(createElement('span', 'task-text', task.text), meta); // textContent: seguro contra XSS

    const main = createElement('div', 'task-main');
    main.append(checkboxWrapper, content);

    // Ações
    const actions = createElement('div', 'task-actions');
    actions.append(
      createActionButton('edit-task-btn', 'Editar tarefa', task, ICONS.edit),
      createActionButton('delete-task-btn', 'Excluir tarefa', task, ICONS.trash)
    );

    li.append(main, actions);
    return li;
  }

  function createActionButton(className, label, task, iconMarkup) {
    const button = createElement('button', `btn-icon-action ${className}`);
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', `${label}: "${task.text}"`);
    button.innerHTML = iconMarkup;
    return button;
  }

  function renderTaskList(tasks) {
    const fragment = document.createDocumentFragment();
    tasks.forEach((task) => fragment.appendChild(createTaskElement(task)));
    elements.taskList.replaceChildren(fragment);
  }

  function renderEmptyState(filteredCount) {
    elements.emptyState.hidden = filteredCount > 0;
    elements.clearFiltersBtn.hidden = true;
    if (filteredCount > 0) return;

    let title, desc;
    if (state.tasks.length === 0) {
      title = 'Nenhuma tarefa cadastrada ainda';
      desc = 'Adicione suas metas e afazeres no formulário acima para começar a produzir!';
    } else if (hasActiveFilters()) {
      title = 'Nenhum resultado encontrado';
      desc = 'Nenhuma tarefa corresponde à pesquisa ou aos filtros escolhidos.';
      elements.clearFiltersBtn.hidden = false;
    } else if (state.filter === 'pending') {
      title = 'Parabéns! Nenhuma tarefa pendente';
      desc = 'Você completou todas as tarefas da sua lista. Excelente trabalho!';
    } else {
      title = 'Nenhuma tarefa concluída no momento';
      desc = 'Marque uma tarefa como concluída para visualizá-la aqui.';
    }
    elements.emptyStateTitle.textContent = title;
    elements.emptyStateDesc.textContent = desc;
  }

  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    elements.totalTasksCount.textContent = total;
    elements.pendingTasksCount.textContent = pending;
    elements.completedTasksCount.textContent = completed;
    elements.percentCount.textContent = `${percent}%`;
    elements.progressText.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressBar.setAttribute('aria-valuenow', percent);

    elements.badgeAll.textContent = total;
    elements.badgePending.textContent = pending;
    elements.badgeCompleted.textContent = completed;
  }

  function renderNav() {
    elements.navItems.forEach((item) => {
      const isActive = item.dataset.filter === state.filter;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
  }

  function fillSelect(select, options, selected) {
    select.replaceChildren(...options.map(([value, label]) => {
      const option = createElement('option', '', label);
      option.value = value;
      return option;
    }));
    select.value = selected;
  }

  function renderCategoryOptions() {
    const used = [...new Set(state.tasks.map((task) => task.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (state.category !== 'all' && !used.includes(state.category)) state.category = 'all';
    fillSelect(elements.categoryFilter, [['all', 'Todas'], ...used.map((name) => [name, name])], state.category);

    const suggestions = [...new Set([...SUGGESTED_CATEGORIES, ...used])];
    elements.categoryList.replaceChildren(...suggestions.map((name) => {
      const option = document.createElement('option');
      option.value = name;
      return option;
    }));
  }

  function renderForm() {
    const editing = Boolean(state.editingId);
    elements.formTitle.textContent = editing ? 'Editar tarefa' : 'Nova tarefa';
    elements.submitLabel.textContent = editing ? 'Salvar alterações' : 'Adicionar';
    elements.cancelEditBtn.hidden = !editing;
    elements.taskForm.classList.toggle('is-editing', editing);
    elements.quickHint.hidden = editing; // entrada rápida só vale ao criar
  }

  function render() {
    renderCategoryOptions();
    const visibleTasks = getVisibleTasks();
    renderTaskList(visibleTasks);
    renderEmptyState(visibleTasks.length);
    renderStats();
    renderNav();
    renderForm();
    state.highlightId = null;
  }

  // ==========================================================================
  // 9b. Paleta de comandos (Ctrl+K)
  // ==========================================================================
  let paletteItems = [];
  let paletteIndex = 0;

  function applyControl(key, value, control) {
    state[key] = value;
    control.value = value;
    render();
  }

  function buildCommands() {
    const commands = [
      { label: 'Nova tarefa', run: () => elements.taskInput.focus() },
      { label: 'Ver todas as tarefas', run: () => setStatusFilter('all') },
      { label: 'Ver tarefas pendentes', run: () => setStatusFilter('pending') },
      { label: 'Ver tarefas concluídas', run: () => setStatusFilter('completed') },
      ...Object.entries(PRIORITIES).map(([key, { label }]) => ({
        label: `Filtrar prioridade ${label.toLowerCase()}`,
        run: () => applyControl('priority', key, elements.priorityFilter)
      })),
      { label: 'Limpar pesquisa e filtros', run: clearSearchAndFilters },
      { label: 'Ordenar por mais recentes', run: () => applyControl('sort', 'created', elements.sortSelect) },
      { label: 'Ordenar por prazo', run: () => applyControl('sort', 'due', elements.sortSelect) },
      { label: 'Ordenar por prioridade', run: () => applyControl('sort', 'priority', elements.sortSelect) },
      { label: 'Alternar tema claro/escuro', run: toggleTheme }
    ];
    if (lastDeleted) commands.unshift({ label: 'Desfazer última exclusão', run: undoDelete });
    state.tasks.forEach((task) => commands.push({ label: `Editar: ${task.text}`, run: () => startEdit(task.id) }));
    return commands;
  }

  function renderPalette() {
    const query = fold(elements.paletteInput.value.trim());
    paletteItems = buildCommands().filter((command) => fold(command.label).includes(query)).slice(0, 8);
    paletteIndex = Math.min(paletteIndex, Math.max(paletteItems.length - 1, 0));

    const options = paletteItems.map((command, i) => {
      const option = createElement('li', 'palette-option' + (i === paletteIndex ? ' active' : ''), command.label);
      option.id = `palette-option-${i}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(i === paletteIndex));
      option.addEventListener('click', () => runPaletteCommand(i));
      return option;
    });
    elements.paletteList.replaceChildren(...(options.length ? options : [createElement('li', 'palette-empty', 'Nenhum comando encontrado.')]));
    elements.paletteInput.setAttribute('aria-activedescendant', options.length ? `palette-option-${paletteIndex}` : '');
  }

  function togglePalette() {
    if (elements.palette.open) {
      elements.palette.close();
      return;
    }
    elements.paletteInput.value = '';
    paletteIndex = 0;
    renderPalette();
    elements.palette.showModal();
    elements.paletteInput.focus();
  }

  function runPaletteCommand(index) {
    const command = paletteItems[index];
    if (!command) return;
    elements.palette.close(); // devolve o foco antes de o comando agir
    command.run();
  }

  function onPaletteKeydown(event) {
    const last = paletteItems.length - 1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (last < 0) return;
      paletteIndex = event.key === 'ArrowDown' ? (paletteIndex >= last ? 0 : paletteIndex + 1) : (paletteIndex <= 0 ? last : paletteIndex - 1);
      renderPalette();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runPaletteCommand(paletteIndex);
    }
  }

  // ==========================================================================
  // 10. Tema claro/escuro
  // ==========================================================================
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    elements.themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  function initTheme() {
    const saved = readStorage(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light'));
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeStorage(THEME_KEY, next);
  }

  // ==========================================================================
  // 11. Eventos
  // ==========================================================================
  function getTaskId(target) {
    const item = target.closest('.task-item');
    return item ? item.dataset.taskId : null;
  }

  function bindEvents() {
    elements.taskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (submitTask()) {
        elements.taskForm.reset();
        elements.taskInput.focus();
      }
    });

    elements.taskForm.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.editingId) cancelEdit();
    });

    elements.taskInput.addEventListener('input', () => {
      if (elements.formFeedback.classList.contains('visible')) clearFeedback();
    });

    elements.cancelEditBtn.addEventListener('click', cancelEdit);

    // Delegação de eventos na lista
    elements.taskList.addEventListener('change', (event) => {
      if (event.target.closest('.custom-checkbox-input')) toggleTaskCompletion(getTaskId(event.target));
    });

    elements.taskList.addEventListener('click', (event) => {
      const taskId = getTaskId(event.target);
      if (!taskId) return;
      if (event.target.closest('.delete-task-btn')) deleteTask(taskId);
      else if (event.target.closest('.edit-task-btn')) startEdit(taskId);
    });

    elements.navItems.forEach((item) => item.addEventListener('click', () => setStatusFilter(item.dataset.filter)));

    elements.searchInput.addEventListener('input', () => { state.search = elements.searchInput.value; render(); });
    elements.priorityFilter.addEventListener('change', () => { state.priority = elements.priorityFilter.value; render(); });
    elements.categoryFilter.addEventListener('change', () => { state.category = elements.categoryFilter.value; render(); });
    elements.sortSelect.addEventListener('change', () => { state.sort = elements.sortSelect.value; render(); });
    elements.clearFiltersBtn.addEventListener('click', clearSearchAndFilters);
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Paleta de comandos e atalhos globais
    elements.paletteBtn.addEventListener('click', togglePalette);
    elements.paletteInput.addEventListener('keydown', onPaletteKeydown);
    elements.paletteInput.addEventListener('input', () => { paletteIndex = 0; renderPalette(); });
    elements.palette.addEventListener('click', (event) => { if (event.target === elements.palette) elements.palette.close(); });

    document.addEventListener('keydown', (event) => {
      const withModifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (withModifier && key === 'k') {
        event.preventDefault();
        togglePalette();
      } else if (withModifier && key === 'z' && lastDeleted && !(event.target.closest && event.target.closest('input, textarea, select'))) {
        event.preventDefault();
        undoDelete();
      }
    });
  }

  // ==========================================================================
  // 12. Inicialização
  // ==========================================================================
  function init() {
    initTheme();
    displayHeader();
    state.tasks = loadTasksFromStorage();
    bindEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
