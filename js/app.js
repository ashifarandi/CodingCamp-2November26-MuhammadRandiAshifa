// Todo List Life Dashboard - Main Application
// Uses ES6+ features with module pattern organization

// Global application namespace
const TodoDashboard = (function() {
    'use strict';

    // ==================== Storage Module ====================
    const StorageModule = (function() {
        const STORAGE_PREFIX = 'todoDashboard_';
        const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
        const MAX_TASKS = 100;
        const MAX_DESCRIPTION_LENGTH = 255;
        
        // In-memory fallback storage
        let memoryStorage = {};
        
        /**
         * Check if Local Storage is available
         * @returns {boolean}
         */
        function isStorageAvailable() {
            try {
                const testKey = STORAGE_PREFIX + '_test';
                window.localStorage.setItem(testKey, 'test');
                window.localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                return false;
            }
        }
        
        /**
         * Get storage key with prefix
         * @param {string} key - Base key name
         * @returns {string}
         */
        function getStorageKey(key) {
            return STORAGE_PREFIX + key;
        }
        
        /**
         * Get item from storage
         * @param {string} key - Storage key
         * @returns {any|null}
         */
        function getItem(key) {
            const storageKey = getStorageKey(key);
            try {
                if (isStorageAvailable()) {
                    const value = window.localStorage.getItem(storageKey);
                    return value ? JSON.parse(value) : null;
                } else {
                    return memoryStorage[storageKey] ? JSON.parse(memoryStorage[storageKey]) : null;
                }
            } catch (error) {
                console.error('Error getting item:', error);
                return null;
            }
        }
        
        /**
         * Set item in storage
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         * @returns {boolean}
         */
        function setItem(key, value) {
            const storageKey = getStorageKey(key);
            try {
                const jsonValue = JSON.stringify(value);
                
                // Check storage size if Local Storage is available
                if (isStorageAvailable()) {
                    // Estimate current storage size
                    const storageSize = getStorageSize();
                    if (storageSize + jsonValue.length > MAX_STORAGE_SIZE) {
                        // Attempt cleanup
                        if (!clearOldEntries()) {
                            throw new Error('Storage quota exceeded');
                        }
                    }
                    window.localStorage.setItem(storageKey, jsonValue);
                } else {
                    memoryStorage[storageKey] = jsonValue;
                }
                return true;
            } catch (error) {
                console.error('Error setting item:', error);
                showError('Unable to save data. Please try again.');
                return false;
            }
        }
        
        /**
         * Remove item from storage
         * @param {string} key - Storage key
         * @returns {boolean}
         */
        function removeItem(key) {
            const storageKey = getStorageKey(key);
            try {
                if (isStorageAvailable()) {
                    window.localStorage.removeItem(storageKey);
                } else {
                    delete memoryStorage[storageKey];
                }
                return true;
            } catch (error) {
                console.error('Error removing item:', error);
                return false;
            }
        }
        
        /**
         * Get current storage size in bytes
         * @returns {number}
         */
        function getStorageSize() {
            if (!isStorageAvailable()) {
                return 0;
            }
            
            let totalSize = 0;
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    totalSize += window.localStorage.getItem(key).length;
                }
            }
            return totalSize;
        }
        
        /**
         * Clear old entries if storage is full
         * @returns {boolean}
         */
        function clearOldEntries() {
            if (!isStorageAvailable()) {
                return false;
            }
            
            // This is a simple implementation - in production, 
            // you might want to implement more sophisticated cleanup
            return false;
        }
        
        /**
         * Clear all storage
         */
        function clearAll() {
            try {
                if (isStorageAvailable()) {
                    const keysToRemove = [];
                    for (let i = 0; i < window.localStorage.length; i++) {
                        const key = window.localStorage.key(i);
                        if (key && key.startsWith(STORAGE_PREFIX)) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => window.localStorage.removeItem(key));
                } else {
                    memoryStorage = {};
                }
            } catch (error) {
                console.error('Error clearing storage:', error);
            }
        }
        
        // Public API
        return {
            isStorageAvailable: isStorageAvailable,
            getItem: getItem,
            setItem: setItem,
            removeItem: removeItem,
            getStorageSize: getStorageSize,
            clearAll: clearAll,
            STORAGE_PREFIX: STORAGE_PREFIX,
            MAX_TASKS: MAX_TASKS,
            MAX_DESCRIPTION_LENGTH: MAX_DESCRIPTION_LENGTH
        };
    })();

    // ==================== Time Module ====================
    const TimeModule = (function() {
        const STORAGE_KEY = 'timeSettings';
        
        /**
         * Format date to MM/DD/YYYY
         * @param {Date} date - Date object
         * @returns {string} Formatted date string or error message for invalid dates
         */
        function formatDate(date) {
            // Handle null, undefined, or non-Date objects
            if (!date || typeof date !== 'object' || !date.getDate) {
                return 'Invalid Date';
            }
            
            // Check if date is valid (NaN check for getTime())
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }
        
        /**
         * Format time to HH:MM AM/PM
         * @param {Date} date - Date object
         * @returns {string} Formatted time string or error message for invalid dates
         */
        function formatTime(date) {
            // Handle null, undefined, or non-Date objects
            if (!date || typeof date !== 'object' || !date.getDate) {
                return 'Invalid Time';
            }
            
            // Check if date is valid (NaN check for getTime())
            if (isNaN(date.getTime())) {
                return 'Invalid Time';
            }
            
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // Handle midnight
            return `${hours}:${minutes} ${ampm}`;
        }
        
        /**
         * Get time-appropriate greeting
         * @param {Date} date - Date object
         * @returns {string}
         */
        function getGreeting(date) {
            const hour = date.getHours();
            
            if (hour >= 5 && hour < 12) {
                return 'Good Morning';
            } else if (hour >= 12 && hour < 18) {
                return 'Good Afternoon';
            } else if (hour >= 18 && hour < 23) {
                return 'Good Evening';
            } else {
                return 'Good Night';
            }
        }
        
        /**
         * Update time display in DOM
         */
        function updateTimeDisplay() {
            // Check if Date API is available
            if (typeof Date === 'undefined') {
                console.error('Date API not available in this browser');
                return;
            }
            
            try {
                const now = new Date();
                document.getElementById('dateDisplay').textContent = formatDate(now);
                document.getElementById('timeDisplay').textContent = formatTime(now);
                document.getElementById('greeting').textContent = getGreeting(now);
            } catch (error) {
                console.error('Error updating time display:', error);
            }
        }
        
        /**
         * Initialize time tracking with minute-interval updates
         */
        function initializeTimeTracking() {
            // Check if Date API is available
            if (typeof Date === 'undefined') {
                console.error('Date API not available - time tracking disabled');
                return;
            }
            
            // Update immediately
            updateTimeDisplay();
            
            // Update every minute (60000 milliseconds)
            const timeInterval = setInterval(updateTimeDisplay, 60000);
            
            // Update at the start of each minute to handle cases where
            // the page was open when the minute changed
            const now = new Date();
            const secondsUntilNextMinute = 60 - now.getSeconds();
            
            setTimeout(() => {
                updateTimeDisplay();
            }, secondsUntilNextMinute * 1000);
        }
        
        // Public API
        return {
            formatDate: formatDate,
            formatTime: formatTime,
            getGreeting: getGreeting,
            updateTimeDisplay: updateTimeDisplay,
            initializeTimeTracking: initializeTimeTracking
        };
    })();

    // ==================== Timer Module ====================
    const TimerModule = (function() {
        const STORAGE_KEY = 'timerState';
        const DEFAULT_DURATION = 25 * 60; // 25 minutes in seconds
        
        let timerInterval = null;
        let timeRemaining = DEFAULT_DURATION;
        let isRunning = false;
        
        /**
         * Parse time remaining to MM:SS format
         * @param {number} seconds - Seconds remaining
         * @returns {string}
         */
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        
        /**
         * Update timer display in DOM
         */
        function updateTimerDisplay() {
            document.getElementById('timer').textContent = formatTime(timeRemaining);
        }
        
        /**
         * Start the timer
         */
        function startTimer() {
            if (isRunning) {
                return; // Idempotent - do nothing if already running
            }
            
            isRunning = true;
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateTimerDisplay();
                
                if (timeRemaining <= 0) {
                    handleTimerComplete();
                }
            }, 1000);
            
            // Save timer state
            saveTimerState();
        }
        
        /**
         * Stop the timer
         */
        function stopTimer() {
            if (!isRunning) {
                return; // Idempotent - do nothing if already stopped
            }
            
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            
            // Save timer state
            saveTimerState();
        }
        
        /**
         * Reset the timer to default duration
         */
        function resetTimer() {
            stopTimer();
            timeRemaining = DEFAULT_DURATION;
            updateTimerDisplay();
            
            // Clear timer state
            StorageModule.removeItem(STORAGE_KEY);
        }
        
        /**
         * Handle timer completion
         */
        function handleTimerComplete() {
            stopTimer();
            timeRemaining = 0;
            updateTimerDisplay();
            
            // Play completion sound or show notification
            // For now, just update display
            document.getElementById('timer').style.color = 'var(--success-color)';
            setTimeout(() => {
                document.getElementById('timer').style.color = 'var(--text-primary)';
            }, 2000);
        }
        
        /**
         * Save timer state to storage
         */
        function saveTimerState() {
            const state = {
                timeRemaining: timeRemaining,
                isRunning: isRunning
            };
            StorageModule.setItem(STORAGE_KEY, state);
        }
        
        /**
         * Load timer state from storage
         */
        function loadTimerState() {
            const state = StorageModule.getItem(STORAGE_KEY);
            if (state) {
                timeRemaining = state.timeRemaining || DEFAULT_DURATION;
                isRunning = state.isRunning || false;
                
                if (isRunning) {
                    // Restart the timer
                    startTimer();
                }
            }
        }
        
        /**
         * Initialize timer module
         */
        function initialize() {
            loadTimerState();
            
            // Set up event listeners
            document.getElementById('startTimer').addEventListener('click', startTimer);
            document.getElementById('stopTimer').addEventListener('click', stopTimer);
            document.getElementById('resetTimer').addEventListener('click', resetTimer);
        }
        
        // Public API
        return {
            startTimer: startTimer,
            stopTimer: stopTimer,
            resetTimer: resetTimer,
            initialize: initialize
        };
    })();

    // ==================== Task Module ====================
    const TaskModule = (function() {
        const STORAGE_KEY = 'tasks';
        
        // Load tasks from storage
        let tasks = StorageModule.getItem(STORAGE_KEY) || [];
        
        /**
         * Generate unique ID
         * @returns {string}
         */
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        /**
         * Validate task description
         * @param {string} description - Task description
         * @returns {string|null} - Error message or null if valid
         */
        function validateDescription(description) {
            if (!description || description.trim() === '') {
                return 'Task description cannot be empty';
            }
            
            const trimmedDescription = description.trim();
            if (trimmedDescription.length > StorageModule.MAX_DESCRIPTION_LENGTH) {
                return `Description must be ${StorageModule.MAX_DESCRIPTION_LENGTH} characters or less`;
            }
            
            return null;
        }
        
        /**
         * Add a new task
         * @param {string} description - Task description
         * @returns {object|null} - Created task or null if failed
         */
        function addTask(description) {
            // Validate description
            const error = validateDescription(description);
            if (error) {
                showError(error);
                return null;
            }
            
            // Check task limit
            if (tasks.length >= StorageModule.MAX_TASKS) {
                showError(`Maximum of ${StorageModule.MAX_TASKS} tasks reached`);
                return null;
            }
            
            const task = {
                id: generateId(),
                description: description.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(task);
            saveTasks();
            
            // Update UI
            renderTasks();
            
            return task;
        }
        
        /**
         * Edit a task
         * @param {string} taskId - Task ID
         * @param {string} newDescription - New task description
         * @returns {boolean}
         */
        function editTask(taskId, newDescription) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) {
                showError('Task not found');
                return false;
            }
            
            // Validate new description
            const error = validateDescription(newDescription);
            if (error) {
                showError(error);
                return false;
            }
            
            task.description = newDescription.trim();
            saveTasks();
            
            // Update UI
            renderTasks();
            
            return true;
        }
        
        /**
         * Toggle task completion status
         * @param {string} taskId - Task ID
         * @returns {boolean}
         */
        function toggleComplete(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) {
                showError('Task not found');
                return false;
            }
            
            task.completed = !task.completed;
            saveTasks();
            
            // Update UI
            renderTasks();
            
            return true;
        }
        
        /**
         * Delete a task
         * @param {string} taskId - Task ID
         * @returns {boolean}
         */
        function deleteTask(taskId) {
            const initialLength = tasks.length;
            tasks = tasks.filter(t => t.id !== taskId);
            
            if (tasks.length === initialLength) {
                showError('Task not found');
                return false;
            }
            
            saveTasks();
            
            // Update UI
            renderTasks();
            
            return true;
        }
        
        /**
         * Save tasks to storage
         * @returns {boolean}
         */
        function saveTasks() {
            return StorageModule.setItem(STORAGE_KEY, tasks);
        }
        
        /**
         * Load tasks from storage
         * @returns {array}
         */
        function loadTasks() {
            tasks = StorageModule.getItem(STORAGE_KEY) || [];
            return tasks;
        }
        
        /**
         * Get all tasks
         * @returns {array}
         */
        function getAllTasks() {
            return tasks;
        }
        
        /**
         * Get task count
         * @returns {number}
         */
        function getTaskCount() {
            return tasks.length;
        }
        
        /**
         * Get active task count
         * @returns {number}
         */
        function getActiveTaskCount() {
            return tasks.filter(t => !t.completed).length;
        }
        
        /**
         * Render tasks to DOM
         */
        function renderTasks() {
            const taskList = document.getElementById('taskList');
            const taskCount = document.getElementById('taskCount');
            
            taskList.innerHTML = '';
            
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.taskId = task.id;
                
                li.innerHTML = `
                    <span class="task-description">${escapeHtml(task.description)}</span>
                    <div class="task-actions">
                        <button class="btn btn-icon complete-toggle" title="Toggle complete">
                            ${task.completed ? '✔' : '○'}
                        </button>
                        <button class="btn btn-icon edit-task" title="Edit task">
                            ✎
                        </button>
                        <button class="btn btn-icon delete-task" title="Delete task">
                            ×
                        </button>
                    </div>
                `;
                
                taskList.appendChild(li);
            });
            
            taskCount.textContent = getActiveTaskCount();
        }
        
        /**
         * Escape HTML special characters
         * @param {string} text - Text to escape
         * @returns {string}
         */
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        /**
         * Initialize task module
         */
        function initialize() {
            loadTasks();
            renderTasks();
            
            // Set up event listeners
            document.getElementById('addTask').addEventListener('click', handleAddTask);
            document.getElementById('taskInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleAddTask();
                }
            });
            
            // Event delegation for task actions
            document.getElementById('taskList').addEventListener('click', handleTaskAction);
        }
        
        /**
         * Handle add task button click
         */
        function handleAddTask() {
            const input = document.getElementById('taskInput');
            const description = input.value;
            
            if (description.trim() === '') {
                showError('Please enter a task description');
                input.focus();
                return;
            }
            
            addTask(description);
            input.value = '';
            input.focus();
        }
        
        /**
         * Handle task action clicks
         * @param {Event} e - Click event
         */
        function handleTaskAction(e) {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            
            const taskId = taskItem.dataset.taskId;
            const action = e.target.classList.contains('complete-toggle') ? 'toggle' :
                          e.target.classList.contains('edit-task') ? 'edit' :
                          e.target.classList.contains('delete-task') ? 'delete' : null;
            
            if (action === 'toggle') {
                toggleComplete(taskId);
            } else if (action === 'edit') {
                // TODO: Implement edit functionality
                console.log('Edit task:', taskId);
            } else if (action === 'delete') {
                deleteTask(taskId);
            }
        }
        
        /**
         * Show error message
         * @param {string} message - Error message
         */
        function showError(message) {
            const errorArea = document.getElementById('taskErrorArea');
            errorArea.textContent = message;
            
            // Clear error after 3 seconds
            setTimeout(() => {
                errorArea.textContent = '';
            }, 3000);
        }
        
        // Public API
        return {
            addTask: addTask,
            editTask: editTask,
            toggleComplete: toggleComplete,
            deleteTask: deleteTask,
            saveTasks: saveTasks,
            loadTasks: loadTasks,
            getAllTasks: getAllTasks,
            getTaskCount: getTaskCount,
            getActiveTaskCount: getActiveTaskCount,
            renderTasks: renderTasks,
            initialize: initialize
        };
    })();

    // ==================== Quick Link Module ====================
    const QuickLinkModule = (function() {
        const STORAGE_KEY = 'links';
        
        // Load links from storage
        let links = StorageModule.getItem(STORAGE_KEY) || [];
        
        /**
         * Generate unique ID
         * @returns {string}
         */
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        /**
         * Validate URL
         * @param {string} url - URL to validate
         * @returns {string|null} - Error message or null if valid
         */
        function validateUrl(url) {
            if (!url || url.trim() === '') {
                return 'URL cannot be empty';
            }
            
            try {
                const urlObj = new URL(url);
                if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                    return 'URL must use http:// or https://';
                }
            } catch (e) {
                return 'Invalid URL format';
            }
            
            return null;
        }
        
        /**
         * Validate link label
         * @param {string} label - Link label
         * @returns {string|null} - Error message or null if valid
         */
        function validateLabel(label) {
            if (!label || label.trim() === '') {
                return 'Link label cannot be empty';
            }
            
            return null;
        }
        
        /**
         * Add a new link
         * @param {string} label - Link label
         * @param {string} url - Link URL
         * @returns {object|null} - Created link or null if failed
         */
        function addLink(label, url) {
            // Validate label
            const labelError = validateLabel(label);
            if (labelError) {
                showError(labelError);
                return null;
            }
            
            // Validate URL
            const urlError = validateUrl(url);
            if (urlError) {
                showError(urlError);
                return null;
            }
            
            const link = {
                id: generateId(),
                label: label.trim(),
                url: url.trim(),
                createdAt: new Date().toISOString()
            };
            
            links.push(link);
            saveLinks();
            
            // Update UI
            renderLinks();
            
            return link;
        }
        
        /**
         * Delete a link
         * @param {string} linkId - Link ID
         * @returns {boolean}
         */
        function deleteLink(linkId) {
            const initialLength = links.length;
            links = links.filter(l => l.id !== linkId);
            
            if (links.length === initialLength) {
                showError('Link not found');
                return false;
            }
            
            saveLinks();
            
            // Update UI
            renderLinks();
            
            return true;
        }
        
        /**
         * Open link in new tab
         * @param {string} url - URL to open
         */
        function openLink(url) {
            try {
                window.open(url, '_blank');
            } catch (e) {
                showError('Failed to open link. Popup blocker may be enabled.');
            }
        }
        
        /**
         * Save links to storage
         * @returns {boolean}
         */
        function saveLinks() {
            return StorageModule.setItem(STORAGE_KEY, links);
        }
        
        /**
         * Load links from storage
         * @returns {array}
         */
        function loadLinks() {
            links = StorageModule.getItem(STORAGE_KEY) || [];
            return links;
        }
        
        /**
         * Get all links
         * @returns {array}
         */
        function getAllLinks() {
            return links;
        }
        
        /**
         * Get link count
         * @returns {number}
         */
        function getLinkCount() {
            return links.length;
        }
        
        /**
         * Truncate URL for display
         * @param {string} url - URL to truncate
         * @param {number} maxLength - Maximum length
         * @returns {string}
         */
        function truncateUrl(url, maxLength = 25) {
            if (url.length <= maxLength) {
                return url;
            }
            return url.substring(0, maxLength) + '...';
        }
        
        /**
         * Render links to DOM
         */
        function renderLinks() {
            const linkList = document.getElementById('linkList');
            const linkCount = document.getElementById('linkCount');
            
            linkList.innerHTML = '';
            
            links.forEach(link => {
                const li = document.createElement('li');
                li.className = 'link-item';
                li.dataset.linkId = link.id;
                
                li.innerHTML = `
                    <div class="link-info">
                        <span class="link-label">${escapeHtml(link.label)}</span>
                        <br>
                        <span class="link-url">${truncateUrl(link.url)}</span>
                    </div>
                    <div class="link-actions">
                        <button class="btn btn-icon open-link" title="Open link">
                            ↗
                        </button>
                        <button class="btn btn-icon delete-link" title="Delete link">
                            ×
                        </button>
                    </div>
                `;
                
                linkList.appendChild(li);
            });
            
            linkCount.textContent = getLinkCount();
        }
        
        /**
         * Escape HTML special characters
         * @param {string} text - Text to escape
         * @returns {string}
         */
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        /**
         * Initialize quick link module
         */
        function initialize() {
            loadLinks();
            renderLinks();
            
            // Set up event listeners
            document.getElementById('addLink').addEventListener('click', handleAddLink);
            document.getElementById('linkLabelInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('linkUrlInput').focus();
                }
            });
            document.getElementById('linkUrlInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleAddLink();
                }
            });
            
            // Event delegation for link actions
            document.getElementById('linkList').addEventListener('click', handleLinkAction);
        }
        
        /**
         * Handle add link button click
         */
        function handleAddLink() {
            const labelInput = document.getElementById('linkLabelInput');
            const urlInput = document.getElementById('linkUrlInput');
            const label = labelInput.value;
            const url = urlInput.value;
            
            if (label.trim() === '') {
                showError('Please enter a link label');
                labelInput.focus();
                return;
            }
            
            if (url.trim() === '') {
                showError('Please enter a URL');
                urlInput.focus();
                return;
            }
            
            addLink(label, url);
            labelInput.value = '';
            urlInput.value = '';
            labelInput.focus();
        }
        
        /**
         * Handle link action clicks
         * @param {Event} e - Click event
         */
        function handleLinkAction(e) {
            const linkItem = e.target.closest('.link-item');
            if (!linkItem) return;
            
            const linkId = linkItem.dataset.linkId;
            const action = e.target.classList.contains('open-link') ? 'open' :
                          e.target.classList.contains('delete-link') ? 'delete' : null;
            
            if (action === 'open') {
                const link = links.find(l => l.id === linkId);
                if (link) {
                    openLink(link.url);
                }
            } else if (action === 'delete') {
                deleteLink(linkId);
            }
        }
        
        /**
         * Show error message
         * @param {string} message - Error message
         */
        function showError(message) {
            const errorArea = document.getElementById('linkErrorArea');
            errorArea.textContent = message;
            
            // Clear error after 3 seconds
            setTimeout(() => {
                errorArea.textContent = '';
            }, 3000);
        }
        
        // Public API
        return {
            addLink: addLink,
            deleteLink: deleteLink,
            openLink: openLink,
            saveLinks: saveLinks,
            loadLinks: loadLinks,
            getAllLinks: getAllLinks,
            getLinkCount: getLinkCount,
            truncateUrl: truncateUrl,
            renderLinks: renderLinks,
            initialize: initialize
        };
    })();

    // ==================== UI Module ====================
    const UIModule = (function() {
        /**
         * Initialize UI module
         */
        function initialize() {
            // Initialize all modules
            TimeModule.initializeTimeTracking();
            TimerModule.initialize();
            TaskModule.initialize();
            QuickLinkModule.initialize();
        }
        
        // Public API
        return {
            initialize: initialize
        };
    })();

    // ==================== Main Initialization ====================
    function init() {
        // Initialize UI
        UIModule.initialize();
        
        // Log initialization
        console.log('Todo List Life Dashboard initialized');
    }
    
    // Expose init function globally
    return {
        init: init
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', TodoDashboard.init);