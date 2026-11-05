// Todo List Life Dashboard
const TodoDashboard = (function () {
    'use strict';

    // ==================== Storage Module ====================
    const StorageModule = (function () {
        const PREFIX = 'todoDashboard_';
        const MAX_TASKS = 100;
        const MAX_DESC = 255;
        let mem = {};

        function available() {
            try {
                localStorage.setItem(PREFIX + '_t', '1');
                localStorage.removeItem(PREFIX + '_t');
                return true;
            } catch (e) { return false; }
        }
        function key(k) { return PREFIX + k; }
        function getItem(k) {
            try {
                const v = available() ? localStorage.getItem(key(k)) : mem[key(k)];
                return v ? JSON.parse(v) : null;
            } catch (e) { return null; }
        }
        function setItem(k, v) {
            try {
                const s = JSON.stringify(v);
                available() ? localStorage.setItem(key(k), s) : (mem[key(k)] = s);
                return true;
            } catch (e) { return false; }
        }
        function removeItem(k) {
            try {
                available() ? localStorage.removeItem(key(k)) : delete mem[key(k)];
                return true;
            } catch (e) { return false; }
        }
        return { getItem, setItem, removeItem, MAX_TASKS, MAX_DESC };
    })();

    // ==================== Settings Module ====================
    // Manages: custom name, dark mode, pomodoro duration
    const SettingsModule = (function () {
        const STORAGE_KEY = 'settings';
        const DEFAULTS = { name: '', theme: 'light', pomodoro: 25 };
        let settings = Object.assign({}, DEFAULTS, StorageModule.getItem(STORAGE_KEY) || {});

        function save() { StorageModule.setItem(STORAGE_KEY, settings); }

        function getName()      { return settings.name; }
        function setName(n)     { settings.name = n.trim(); save(); }
        function getTheme()     { return settings.theme; }
        function setTheme(t)    { settings.theme = t; save(); }
        function getPomodoro()  { return settings.pomodoro; }
        function setPomodoro(m) { settings.pomodoro = Math.max(1, Math.min(120, Number(m))); save(); }

        return { getName, setName, getTheme, setTheme, getPomodoro, setPomodoro };
    })();

    // ==================== Theme Module ====================
    const ThemeModule = (function () {
        function apply(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const btn = document.getElementById('themeToggle');
            if (btn) btn.textContent = theme === 'dark' ? '\u2600' : '\u263D'; // ☀ / ☽
        }
        function toggle() {
            const next = SettingsModule.getTheme() === 'dark' ? 'light' : 'dark';
            SettingsModule.setTheme(next);
            apply(next);
        }
        function initialize() {
            apply(SettingsModule.getTheme());
            document.getElementById('themeToggle').addEventListener('click', toggle);
        }
        return { initialize };
    })();

    // ==================== Time Module ====================
    const TimeModule = (function () {
        function formatDate(d) {
            if (!d || isNaN(d.getTime())) return '';
            return d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        }
        function formatTime(d) {
            if (!d || isNaN(d.getTime())) return '';
            return [d.getHours(), d.getMinutes(), d.getSeconds()]
                .map(n => String(n).padStart(2, '0')).join(':');
        }
        function greetingWord(d) {
            const h = d.getHours();
            if (h >= 5  && h < 12) return 'Good Morning';
            if (h >= 12 && h < 18) return 'Good Afternoon';
            if (h >= 18 && h < 23) return 'Good Evening';
            return 'Good Night';
        }
        function updateDisplay() {
            const now = new Date();
            document.getElementById('timeDisplay').textContent = formatTime(now);
            document.getElementById('dateDisplay').textContent = formatDate(now);
            const name = SettingsModule.getName();
            const word = greetingWord(now);
            document.getElementById('greeting').textContent = name ? `${word}, ${name}!` : word;
        }
        function initialize() {
            updateDisplay();
            setInterval(updateDisplay, 1000);
        }
        return { initialize, updateDisplay };
    })();

    // ==================== Timer Module ====================
    const TimerModule = (function () {
        const STORAGE_KEY = 'timerState';
        let duration    = SettingsModule.getPomodoro() * 60;
        let remaining   = duration;
        let interval    = null;
        let running     = false;

        function fmt(s) {
            return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
        }
        function updateDisplay() {
            document.getElementById('timer').textContent = fmt(remaining);
        }
        function saveState() {
            StorageModule.setItem(STORAGE_KEY, { remaining, running });
        }
        function startTimer() {
            if (running) return;
            running = true;
            interval = setInterval(() => {
                remaining--;
                updateDisplay();
                if (remaining <= 0) complete();
            }, 1000);
            saveState();
        }
        function stopTimer() {
            if (!running) return;
            clearInterval(interval); interval = null; running = false;
            saveState();
        }
        function resetTimer() {
            stopTimer();
            remaining = duration;
            updateDisplay();
            StorageModule.removeItem(STORAGE_KEY);
        }
        function complete() {
            stopTimer(); remaining = 0; updateDisplay();
            const el = document.getElementById('timer');
            el.style.color = '#2ecc71';
            setTimeout(() => el.style.color = '', 3000);
        }
        function setDuration(mins) {
            const wasRunning = running;
            stopTimer();
            duration  = mins * 60;
            remaining = duration;
            SettingsModule.setPomodoro(mins);
            updateDisplay();
            if (wasRunning) startTimer();
        }
        function initialize() {
            // Restore saved state
            const s = StorageModule.getItem(STORAGE_KEY);
            if (s) {
                remaining = s.remaining ?? duration;
                if (s.running) startTimer();
            }
            updateDisplay();
            // Sync duration input
            document.getElementById('pomodoroDuration').value = SettingsModule.getPomodoro();

            document.getElementById('startTimer').addEventListener('click', startTimer);
            document.getElementById('stopTimer').addEventListener('click', stopTimer);
            document.getElementById('resetTimer').addEventListener('click', resetTimer);
            document.getElementById('setDurationBtn').addEventListener('click', () => {
                const v = parseInt(document.getElementById('pomodoroDuration').value, 10);
                if (!isNaN(v) && v >= 1 && v <= 120) {
                    setDuration(v);
                }
            });
        }
        return { initialize };
    })();

    // ==================== Task Module ====================
    const TaskModule = (function () {
        const STORAGE_KEY = 'tasks';
        let tasks    = StorageModule.getItem(STORAGE_KEY) || [];
        function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

        function validate(desc) {
            if (!desc || !desc.trim()) return 'Task description cannot be empty.';
            if (desc.trim().length > StorageModule.MAX_DESC) return `Max ${StorageModule.MAX_DESC} characters.`;
            return null;
        }

        function saveTasks() { StorageModule.setItem(STORAGE_KEY, tasks); }

        function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

        function renderTasks() {
            const list  = document.getElementById('taskList');
            const count = document.getElementById('taskCount');
            list.innerHTML = '';
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item' + (task.completed ? ' completed' : '');
                li.dataset.taskId = task.id;
                li.innerHTML = `
                    <input type="checkbox" class="complete-toggle" ${task.completed ? 'checked' : ''} aria-label="Toggle complete">
                    <span class="task-description">${esc(task.description)}</span>
                    <div class="task-actions">
                        <button class="delete-task">Delete</button>
                    </div>`;
                list.appendChild(li);
            });
            const active = tasks.filter(t => !t.completed).length;
            count.textContent = active === 0 ? (tasks.length ? 'All done!' : '') : `${active} task${active !== 1 ? 's' : ''} remaining`;
        }

        function addTask(desc) {
            const err = validate(desc);
            if (err) { showError(err); return null; }
            if (tasks.length >= StorageModule.MAX_TASKS) { showError('Task limit reached (100).'); return null; }
            const task = { id: uid(), description: desc.trim(), completed: false, createdAt: new Date().toISOString() };
            tasks.push(task);
            saveTasks();
            renderTasks();
            return task;
        }

        function toggleComplete(id) {
            const t = tasks.find(t => t.id === id);
            if (!t) return;
            t.completed = !t.completed;
            saveTasks(); renderTasks();
        }

        function deleteTask(id) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks(); renderTasks();
        }

        function showError(msg) {
            const el = document.getElementById('taskErrorArea');
            el.textContent = msg;
            setTimeout(() => el.textContent = '', 3000);
        }

        function initialize() {
            renderTasks();

            document.getElementById('addTask').addEventListener('click', handleAdd);
            document.getElementById('taskInput').addEventListener('keypress', e => {
                if (e.key === 'Enter') handleAdd();
            });
            document.getElementById('taskList').addEventListener('click', handleAction);
        }

        function handleAdd() {
            const inp = document.getElementById('taskInput');
            if (!inp.value.trim()) { showError('Please enter a task description.'); inp.focus(); return; }
            if (addTask(inp.value)) { inp.value = ''; inp.focus(); }
        }

        function handleAction(e) {
            const item = e.target.closest('.task-item');
            if (!item) return;
            const id = item.dataset.taskId;
            if (e.target.type === 'checkbox' || e.target.classList.contains('complete-toggle')) toggleComplete(id);
            else if (e.target.classList.contains('delete-task')) deleteTask(id);
        }

        return { initialize };
    })();

    // ==================== Quick Link Module ====================
    const QuickLinkModule = (function () {
        const STORAGE_KEY = 'links';
        let links = StorageModule.getItem(STORAGE_KEY) || [];

        function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
        function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

        function validateUrl(url) {
            if (!url || !url.trim()) return 'URL cannot be empty.';
            try {
                const u = new URL(url);
                if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'URL must start with http:// or https://';
            } catch { return 'Invalid URL format.'; }
            return null;
        }

        function saveLinks() { StorageModule.setItem(STORAGE_KEY, links); }

        function renderLinks() {
            const list  = document.getElementById('linkList');
            const count = document.getElementById('linkCount');
            list.innerHTML = '';
            links.forEach(link => {
                const li = document.createElement('li');
                li.className = 'link-item';
                li.dataset.linkId = link.id;
                li.innerHTML = `
                    <button class="open-link" title="${esc(link.url)}">${esc(link.label)}</button>
                    <button class="delete-link" aria-label="Delete ${esc(link.label)}">&#215;</button>`;
                list.appendChild(li);
            });
            count.textContent = links.length ? `${links.length} link${links.length !== 1 ? 's' : ''}` : '';
        }

        function addLink(label, url) {
            if (!label.trim()) { showError('Link label cannot be empty.'); return null; }
            const err = validateUrl(url);
            if (err) { showError(err); return null; }
            const link = { id: uid(), label: label.trim(), url: url.trim(), createdAt: new Date().toISOString() };
            links.push(link);
            saveLinks(); renderLinks();
            return link;
        }

        function deleteLink(id) {
            links = links.filter(l => l.id !== id);
            saveLinks(); renderLinks();
        }

        function showError(msg) {
            const el = document.getElementById('linkErrorArea');
            el.textContent = msg;
            setTimeout(() => el.textContent = '', 3000);
        }

        function initialize() {
            renderLinks();
            document.getElementById('addLink').addEventListener('click', handleAdd);
            document.getElementById('linkLabelInput').addEventListener('keypress', e => {
                if (e.key === 'Enter') { e.preventDefault(); document.getElementById('linkUrlInput').focus(); }
            });
            document.getElementById('linkUrlInput').addEventListener('keypress', e => {
                if (e.key === 'Enter') handleAdd();
            });
            document.getElementById('linkList').addEventListener('click', e => {
                const item = e.target.closest('.link-item');
                if (!item) return;
                const id = item.dataset.linkId;
                if (e.target.classList.contains('open-link')) {
                    const l = links.find(l => l.id === id);
                    if (l) window.open(l.url, '_blank');
                } else if (e.target.classList.contains('delete-link')) {
                    deleteLink(id);
                }
            });
        }

        function handleAdd() {
            const lbl = document.getElementById('linkLabelInput');
            const url = document.getElementById('linkUrlInput');
            if (addLink(lbl.value, url.value)) {
                lbl.value = ''; url.value = ''; lbl.focus();
            }
        }

        return { initialize };
    })();

    // ==================== Settings Panel Module ====================
    const SettingsPanelModule = (function () {
        function initialize() {
            const btn   = document.getElementById('settingsBtn');
            const panel = document.getElementById('settingsPanel');
            const inp   = document.getElementById('customNameInput');
            const save  = document.getElementById('saveNameBtn');

            // Restore saved name
            inp.value = SettingsModule.getName();

            btn.addEventListener('click', () => {
                panel.hidden = !panel.hidden;
            });

            save.addEventListener('click', () => {
                SettingsModule.setName(inp.value);
                TimeModule.updateDisplay(); // refresh greeting immediately
                panel.hidden = true;
            });

            inp.addEventListener('keypress', e => {
                if (e.key === 'Enter') save.click();
            });
        }
        return { initialize };
    })();

    // ==================== Init ====================
    function init() {
        ThemeModule.initialize();
        TimeModule.initialize();
        TimerModule.initialize();
        TaskModule.initialize();
        QuickLinkModule.initialize();
        SettingsPanelModule.initialize();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', TodoDashboard.init);

