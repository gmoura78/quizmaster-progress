const STATUS_LABELS = {
  done: "Complete",
  current: "Current",
  "in-progress": "In progress",
  "not-started": "Planned",
  blocked: "Blocked",
  testing: "Testing",
  deferred: "Deferred"
};

const STATUS_ICONS = {
  done: "✓",
  current: "•",
  blocked: "!",
  testing: "↻",
  deferred: "–"
};

function text(elementId, value) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}

function createTag(value) {
  const tag = document.createElement("span");
  tag.textContent = value;
  return tag;
}

function calculateProgress(sprints) {
  const tasks = sprints.flatMap((sprint) => sprint.tasks);
  const completed = tasks.filter((task) => task.status === "done").length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

function createTask(task) {
  const item = document.createElement("li");
  const status = document.createElement("span");
  const content = document.createElement("div");
  const label = document.createElement("span");

  item.className = `task-item task-item--${task.status}`;
  status.className = "task-status";
  status.textContent = STATUS_ICONS[task.status] ?? "";
  content.className = "task-content";
  label.className = "task-title";
  label.textContent = `${task.number}. ${task.title}`;

  content.append(label);

  if (task.work) {
    const work = document.createElement("p");
    work.className = "task-work";
    work.textContent = task.work;
    content.append(work);
  }

  if (task.completionGate) {
    const gate = document.createElement("p");
    const gateLabel = document.createElement("strong");
    gate.className = "task-gate";
    gateLabel.textContent = "Completion gate:";
    gate.append(gateLabel, ` ${task.completionGate}`);
    content.append(gate);
  }

  item.setAttribute(
    "aria-label",
    `${task.title}: ${STATUS_LABELS[task.status] ?? task.status}`
  );
  item.append(status, content);
  return item;
}

function createSprintGovernance(sprint) {
  if (!sprint.planningNote && !sprint.sourceHierarchy?.length && !sprint.reviewNote) {
    return null;
  }

  const governance = document.createElement("section");
  governance.className = "sprint-governance";

  if (sprint.planningNote) {
    const planningNote = document.createElement("p");
    planningNote.className = "sprint-planning-note";
    planningNote.textContent = sprint.planningNote;
    governance.append(planningNote);
  }

  if (sprint.sourceHierarchy?.length) {
    const heading = document.createElement("h4");
    const sourceList = document.createElement("ol");
    heading.textContent = "Source hierarchy";
    sourceList.className = "source-hierarchy";

    sprint.sourceHierarchy.forEach((source) => {
      const item = document.createElement("li");
      item.textContent = source;
      sourceList.append(item);
    });

    governance.append(heading, sourceList);
  }

  if (sprint.reviewNote) {
    const reviewNote = document.createElement("p");
    reviewNote.className = "source-review-note";
    reviewNote.textContent = sprint.reviewNote;
    governance.append(reviewNote);
  }

  return governance;
}

function createSprint(sprint) {
  const completed = sprint.tasks.filter((task) => task.status === "done").length;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const number = document.createElement("span");
  const heading = document.createElement("div");
  const title = document.createElement("h3");
  const goal = document.createElement("p");
  const metric = document.createElement("div");
  const metricValue = document.createElement("strong");
  const metricLabel = document.createElement("span");
  const taskList = document.createElement("ul");
  const governance = createSprintGovernance(sprint);

  details.className = "sprint-card";
  details.open = sprint.status === "in-progress";
  summary.className = "sprint-summary";
  number.className = "sprint-number";
  number.textContent = String(sprint.number).padStart(2, "0");
  heading.className = "sprint-heading";
  title.textContent = sprint.title;
  goal.textContent = sprint.goal;
  metric.className = "sprint-metric";
  metricValue.textContent = `${completed}/${sprint.tasks.length}`;
  metricLabel.textContent = completed === sprint.tasks.length ? "Complete" : "Tasks done";
  taskList.className = "task-list";

  sprint.tasks.forEach((task) => taskList.append(createTask(task)));
  heading.append(title, goal);
  metric.append(metricValue, metricLabel);
  summary.append(number, heading, metric);
  details.append(summary);

  if (governance) {
    details.append(governance);
  }

  details.append(taskList);
  return details;
}

function formatDate(value) {
  if (!value) {
    return "Not published yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

function render(data) {
  const progress = calculateProgress(data.sprints);
  const progressRing = document.getElementById("progress-ring");
  const progressBar = document.getElementById("overall-progress-bar");
  const projectTags = document.getElementById("project-tags");
  const sprintList = document.getElementById("sprint-list");
  const highlightsList = document.getElementById("highlights-list");

  text("completion-percentage", `${progress.percentage}%`);
  text(
    "completion-caption",
    `${progress.completed} of ${progress.total} approved roadmap tasks complete`
  );

  if (progressRing) {
    progressRing.style.setProperty("--progress", `${progress.percentage * 3.6}deg`);
  }

  if (progressBar) {
    progressBar.style.width = `${progress.percentage}%`;
  }

  [
    data.project.status,
    data.project.capacity,
    data.project.deployment
  ].forEach((value) => projectTags?.append(createTag(value)));

  if (data.currentTask) {
    text("current-task-label", data.currentTask.label);
    text("current-task-title", data.currentTask.title);
    text("current-task-summary", data.currentTask.summary);
  } else {
    text("current-task-label", "No active task");
    text("current-task-title", "Awaiting project-owner direction");
    text(
      "current-task-summary",
      "All currently authorized release work is complete. Deferred or not-started " +
        "roadmap work will not begin without project-owner authorization."
    );
  }

  text("next-milestone-title", data.nextMilestone.title);
  text("next-milestone-summary", data.nextMilestone.summary);

  data.sprints.forEach((sprint) => sprintList?.append(createSprint(sprint)));

  data.highlights.forEach((highlight) => {
    const item = document.createElement("li");
    item.textContent = highlight;
    highlightsList?.append(item);
  });

  const build = data.build ?? {};
  const testStatus = document.getElementById("test-status");
  const status = build.testStatus ?? "waiting";

  text(
    "test-status",
    status === "passed" ? "All checks passed" : status === "failed" ? "Checks failed" : "Waiting for workflow"
  );
  text("test-count", Number.isInteger(build.testCount) ? `${build.testCount} passing` : "—");
  text("commit-sha", build.commitSha ?? "—");
  text("updated-at", formatDate(build.updatedAt));

  testStatus?.classList.toggle("status-passed", status === "passed");
  testStatus?.classList.toggle("status-failed", status === "failed");
}

async function initialize() {
  try {
    const response = await fetch("project-progress.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Progress request failed with ${response.status}`);
    }

    render(await response.json());
  } catch (error) {
    console.error(error);
    text("completion-caption", "Progress is temporarily unavailable.");
    text("current-task-title", "Unable to load progress");
  }
}

initialize();
