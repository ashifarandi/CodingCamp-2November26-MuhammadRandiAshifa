# Design Document: Todo List Life Dashboard

## Overview

The Todo List Life Dashboard is a standalone web application that provides users with a focused interface to manage daily tasks, stay productive with a 25-minute focus timer, and quickly access favorite websites. The application runs entirely in the browser using vanilla JavaScript, HTML, and CSS, with all data persisted using Local Storage.

### Key Features
- **Time and Greeting Display**: Shows current date/time with time-appropriate greeting
- **Focus Timer**: 25-minute countdown timer with start, stop, and reset controls
- **Task Management**: Full CRUD operations for tasks with local persistence
- **Quick Links**: Save and access favorite websites with URL validation

### Technical Stack
- **HTML5**: Semantic structure for dashboard sections
- **CSS3**: Modular styling with CSS variables and flexbox/grid layout
- **Vanilla JavaScript**: ES6+ features with module pattern organization
- **Local Storage**: Data persistence across sessions

## Architecture

### Component Structure

```
Todo List Life Dashboard
├── Header Section
│   ├── Date Display (MM/DD/YYYY)
│   ├── Time Display (HH:MM AM/PM)
│   └── Greeting Message
├── Focus Timer Section
│   ├── Timer Display (MM:SS)
│   ├── Start Button
│   ├── Stop Button
│   └── Reset Button
├── Task Management Section
│   ├── Task Input Field
│   ├── Add Task Button
│   ├── Task List (rendered items)
│   │   ├── Task Description
│   │   ├── Edit Button
│   │   ├── Complete Toggle
│   │   └── Delete Button
│   └── Task Count Display
└── Quick Links Section
    ├── Link Input Fields (Label, URL)
    ├── Add Link Button
    ├── Link List (rendered items)
    │   ├── Link Label
│   │   ├── Link URL Preview
│   │   └── Delete Button
│   └── Link Count Display
```

### Module Organization

The JavaScript code will be organized into logical modules using the module pattern:

```javascript
// Global application namespace
const TodoDashboard = {
  timeModule: TimeModule,
  timerModule: TimerModule,
  taskModule: TaskModule,
  quickLinkModule: QuickLinkModule,
  storageModule: StorageModule,
  uiModule: UIModule
};
```

### Local Storage Keys

| Key | Purpose | Data Type |
|-----|---------|-----------|
| `todoDashboard_tasks` | Store all tasks | Array of Task objects |
| `todoDashboard_links` | Store all quick links | Array of Link objects |
| `todoDashboard_settings` | Store user preferences | Object |

### Data Structures

#### Task Object
```javascript
{
  id: "uuid-v4-string",           // Unique identifier
  description: "string",          // Task description (max 255 chars)
  completed: boolean,             // Completion status
  createdAt: "ISO-8601-timestamp" // Creation timestamp
}
```

#### Quick Link Object
```javascript
{
  id: "uuid-v4-string",    // Unique identifier
  label: "string",         // Display label
  url: "string",           // URL (http:// or https://)
  createdAt: "timestamp"   // Creation timestamp
}
```

## Components and Interfaces

### Time Module (`js/app.js` - time section)

Handles time display and greeting logic.

**Functions:**
- `formatDate(date)`: Returns date in MM/DD/YYYY format
- `formatTime(date)`: Returns time in HH:MM AM/PM format
- `getGreeting(date)`: Returns appropriate greeting based on time
- `updateTimeDisplay()`: Updates DOM with current time and greeting
- `initializeTimeTracking()`: Sets up minute-interval updates

**Dependencies:**
- `Date` API (with fallback handling)

### Timer Module (`js/app.js` - timer section)

Handles focus timer functionality.

**Functions:**
- `startTimer()`: Begins countdown from 25:00
- `stopTimer()`: Pauses timer, preserving remaining time
- `resetTimer()`: Returns to 25:00 and stops
- `updateTimerDisplay()`: Updates DOM with current time
- `handleTimerComplete()`: Triggers completion indicator
- `tick()`: Decrements timer by 1 second

**State:**
- `timerInterval`: setInterval ID for timer updates
- `timeRemaining`: Seconds remaining (default: 1500)
- `isRunning`: Boolean state

### Task Module (`js/app.js` - task section)

Handles task CRUD operations.

**Functions:**
- `addTask(description)`: Creates and saves new task
- `editTask(id, newDescription)`: Updates task description
- `toggleComplete(id)`: Toggles task completion status
- `deleteTask(id)`: Removes task from list
- `loadTasks()`: Loads tasks from Local Storage
- `saveTasks()`: Saves tasks to Local Storage
- `validateDescription(description)`: Validates task description

**Constraints:**
- Maximum 100 tasks
- Maximum 255 characters per description
- Empty descriptions rejected

### Quick Link Module (`js/app.js` - quick links section)

Handles quick link management.

**Functions:**
- `addLink(label, url)`: Creates and saves new quick link
- `deleteLink(id)`: Removes link from list
- `openLink(url)`: Opens URL in new tab
- `loadLinks()`: Loads links from Local Storage
- `saveLinks()`: Saves links to Local Storage
- `validateUrl(url)`: Validates URL format (http/https)
- `truncateUrl(url)`: Truncates URLs over 25 chars with "..."

**Constraints:**
- URLs must be http:// or https:// format
- Empty labels or URLs rejected
- Popup blocker error handling

### Storage Module (`js/app.js` - storage section)

Handles Local Storage operations with error handling.

**Functions:**
- `getItem(key)`: Gets item from Local Storage
- `setItem(key, value)`: Sets item in Local Storage
- `removeItem(key)`: Removes item from Local Storage
- `getStorageSize()`: Gets current storage usage
- `clearOldEntries()`: Clears old entries if storage is full
- `isStorageAvailable()`: Checks if Local Storage is available

**Error Handling:**
- Catch quota exceeded errors
- Catch security errors (disabled Local Storage)
- Fallback to in-memory storage if Local Storage unavailable

### UI Module (`js/app.js` - UI section)

Handles DOM manipulation and rendering.

**Functions:**
- `renderTasks(tasks)`: Renders task list to DOM
- `renderLinks(links)`: Renders quick links to DOM
- `showError(message)`: Displays error messages
- `clearErrors()`: Clears error messages
- `bindEventListeners()`: Binds all event handlers
- `updateTaskCount()`: Updates task count display
- `updateLinkCount()`: Updates link count display

## Data Models

### Task Schema
```javascript
{
  id: "string (uuid-v4)",
  description: "string (max 255 chars)",
  completed: "boolean",
  createdAt: "string (ISO-8601)"
}
```

### Quick Link Schema
```javascript
{
  id: "string (uuid-v4)",
  label: "string",
  url: "string (http/https)",
  createdAt: "string (ISO-8601)"
}
```

### Storage Schema
```javascript
{
  tasks: [Task],
  links: [QuickLink],
  settings: {
    theme: "light|dark",
    timerDuration: 1500 // seconds (default 25 minutes)
  }
}
```

## Error Handling

### Time and Greeting Errors
- Catch `Intl.DateTimeFormat` errors and display "Time unavailable"
- Handle invalid date objects gracefully
- Provide fallback for browsers without date/time APIs

### Timer Errors
- Clear interval on stop/reset to prevent memory leaks
- Handle rapid button clicks (idempotent start/stop)
- Validate timer duration is positive integer
- Gracefully handle page navigation during active timer

### Task Management Errors
- Validate description length (0-255 chars)
- Reject empty or whitespace-only descriptions
- Limit to 100 tasks max with clear error message
- Handle Local Storage quota exceeded errors by attempting cleanup

### Quick Link Errors
- Validate URL format (must start with http:// or https://)
- Reject empty labels or URLs with clear error message
- Truncate long URLs (>25 chars) with "..." for display
- Handle popup blocker by catching window.open failures and displaying warning

### Storage Errors
- Wrap all Local Storage operations in try-catch blocks
- Fallback to in-memory storage if Local Storage unavailable
- Clear old entries when storage is full
- Detect and warn when Local Storage is disabled

### UI Errors
- Display user-friendly error messages in dedicated error area
- Clear errors on subsequent successful operations
- Provide visual feedback for all user actions (loading states)
- Handle DOM manipulation errors gracefully

## Testing Strategy

### Unit Tests (Example-Based)

**Task Module:**
```javascript
// Test valid task creation
addTask("Test task") → should create task with id, description, completed=false

// Test invalid task creation
addTask("") → should throw error, not add task
addTask(" ".repeat(256)) → should throw error, not add task

// Test task limits
addTask("task 1")...addTask("task 100") → should succeed
addTask("task 101") → should throw error

// Test CRUD operations
editTask(id, "new desc") → should update description
toggleComplete(id) → should toggle completed status
deleteTask(id) → should remove task
```

**Quick Link Module:**
```javascript
// Test valid link creation
addLink("Google", "https://google.com") → should create link

// Test invalid link creation
addLink("", "https://google.com") → should throw error
addLink("Google", "") → should throw error
addLink("Site", "ftp://example.com") → should throw error
addLink("Site", "not-a-url") → should throw error
```

**Timer Module:**
```javascript
// Test timer countdown
startTimer() → should count down from 1500 to 0
stopTimer() → should pause at current value
resetTimer() → should return to 1500

// Test idempotent operations
startTimer() → startTimer() → same running state
stopTimer() → stopTimer() → same stopped state
```

**Storage Module:**
```javascript
// Test Local Storage availability check
isStorageAvailable() → should return false when Local Storage disabled

// Test error handling
setItem("key", "value") when full → should attempt cleanup, then save
```

### Integration Tests

**End-to-End Workflows:**
- Complete user workflow: add task, complete task, delete task
- Timer workflow: start, stop, reset, complete
- Data persistence: reload page, verify data intact
- Link workflow: add link, open link, delete link

**Cross-Browser Compatibility:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Error Scenarios:**
- Local Storage disabled/quota exceeded
- Popup blocker triggered
- Date/Time API unavailable

### Snapshot Tests

**DOM Structure:**
- Task list rendering with different states
- Link list rendering with different URL lengths
- Timer display in various states (running, stopped, completed)

### Testing Tools

- **Unit Testing**: Jest or Mocha/Chai
- **Integration Testing**: Cypress or Selenium
- **Snapshot Testing**: Jest snapshot testing or DOM snapshot libraries
- **Browser Testing**: Cross-browser testing service (BrowserStack, Sauce Labs)

### Test Coverage Goals

- 80% minimum for pure logic functions
- Cover all error scenarios
- Test boundary conditions (100 tasks limit, 255 char limit, etc.)