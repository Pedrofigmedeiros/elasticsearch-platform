const state = {
  results: [],
  query: '',
};

const elements = {
  form: document.querySelector('#search-form'),
  query: document.querySelector('#query'),
  searchButton: document.querySelector('.search-button'),
  results: document.querySelector('#results'),
  template: document.querySelector('#result-template'),
  count: document.querySelector('#result-count'),
  summary: document.querySelector('#result-summary'),
  sort: document.querySelector('#sort'),
  clearFilters: document.querySelector('#clear-filters'),
  activeFilterCount: document.querySelector('#active-filter-count'),
  jobTypeFilters: document.querySelector('#job-type-filters'),
  levelFilters: document.querySelector('#level-filters'),
  themeToggle: document.querySelector('#theme-toggle'),
};

const text = (value, fallback = 'Not specified') => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
};

const initials = (company) => text(company, 'Job')
  .split(/\s+/)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

const inferSetup = (job) => {
  const haystack = `${text(job.job_location, '')} ${text(job.job_title, '')}`.toLowerCase();
  if (haystack.includes('remote')) return 'remote';
  if (haystack.includes('hybrid')) return 'hybrid';
  return 'onsite';
};

const displayDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? text(value)
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const appendText = (parent, tag, content, className) => {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  parent.append(node);
  return node;
};

const createMeta = (container, label, value) => {
  const item = document.createElement('span');
  appendText(item, 'b', `${label}: `);
  item.append(document.createTextNode(text(value)));
  container.append(item);
};

const createField = (key, value) => {
  const item = document.createElement('div');
  item.className = 'field';
  appendText(item, 'small', key);
  appendText(item, 'span', text(value));
  item.title = text(value);
  return item;
};

const renderResult = (result, index) => {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector('.result-card');
  const job = result.job || {};
  fragment.querySelector('.rank').textContent = `#${index + 1}`;
  fragment.querySelector('.result-title h2').textContent = text(job.job_title, 'Untitled job');
  fragment.querySelector('.result-title p').textContent = `${text(job.company)} · ${text(job.job_location)}`;
  fragment.querySelector('.score strong').textContent = typeof result.score === 'number' ? result.score.toFixed(3) : '—';
  fragment.querySelector('.job-avatar').textContent = initials(job.company);

  const meta = fragment.querySelector('.job-meta');
  createMeta(meta, 'Position', job.search_position);
  createMeta(meta, 'City', job.search_city);
  createMeta(meta, 'Country', job.search_country);
  createMeta(meta, 'First seen', displayDate(job.first_seen));

  const tags = fragment.querySelector('.job-tags');
  [job.job_type, job.job_level, inferSetup(job)].filter(Boolean).forEach((value) => appendText(tags, 'span', value));

  const link = fragment.querySelector('.job-link');
  if (job.job_link) link.href = job.job_link;

  const indexedFields = fragment.querySelector('.indexed-fields');
  const fieldGrid = document.createElement('div');
  fieldGrid.className = 'field-grid';
  Object.entries(job).forEach(([key, value]) => fieldGrid.append(createField(key, value)));
  indexedFields.append(fieldGrid);

  const expand = fragment.querySelector('.expand-button');
  expand.addEventListener('click', () => {
    const isOpen = expand.getAttribute('aria-expanded') === 'true';
    expand.setAttribute('aria-expanded', String(!isOpen));
    expand.textContent = isOpen ? '+' : '−';
    indexedFields.hidden = isOpen;
  });

  return card;
};

const currentFilters = () => [...document.querySelectorAll('.filters input:checked')].map((input) => ({
  name: input.name,
  value: input.value,
}));

const filteredResults = () => {
  const filters = currentFilters();
  let results = [...state.results];

  filters.forEach((filter) => {
    results = results.filter(({ job = {} }) => {
      if (filter.name === 'setup') return inferSetup(job) === filter.value;
      if (filter.name === 'job_type') return text(job.job_type, '') === filter.value;
      if (filter.name === 'job_level') return text(job.job_level, '') === filter.value;
      return true;
    });
  });

  const sort = elements.sort.value;
  if (sort === 'company') results.sort((a, b) => text(a.job?.company, '').localeCompare(text(b.job?.company, '')));
  if (sort === 'title') results.sort((a, b) => text(a.job?.job_title, '').localeCompare(text(b.job?.job_title, '')));
  return results;
};

const render = () => {
  const results = filteredResults();
  elements.results.replaceChildren();
  results.forEach((result, index) => elements.results.append(renderResult(result, index)));
  elements.activeFilterCount.textContent = `${currentFilters().length} active`;
  elements.count.textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
  elements.summary.textContent = state.query ? `for “${state.query}”` : 'Results from the jobs alias';

  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    appendText(empty, 'span', '⌕', 'empty-icon');
    appendText(empty, 'h2', state.results.length ? 'No results match these filters' : 'No jobs found');
    appendText(empty, 'p', state.results.length ? 'Clear a filter to see more results.' : 'Try another title, company, city or country.');
    elements.results.append(empty);
  }
};

const valuesWithCounts = (key) => {
  const counts = new Map();
  state.results.forEach(({ job = {} }) => {
    const value = text(job[key], '');
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const renderFilterGroup = (container, name, values) => {
  container.replaceChildren();
  if (!values.length) {
    appendText(container, 'p', 'No options in these results.');
    return;
  }
  values.forEach(([value, count]) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.value = value;
    input.addEventListener('change', render);
    label.append(input, document.createTextNode(value));
    appendText(label, 'span', count);
    container.append(label);
  });
};

const updateFilterOptions = () => {
  renderFilterGroup(elements.jobTypeFilters, 'job_type', valuesWithCounts('job_type'));
  renderFilterGroup(elements.levelFilters, 'job_level', valuesWithCounts('job_level'));
  ['remote', 'hybrid', 'onsite'].forEach((setup) => {
    const count = state.results.filter(({ job = {} }) => inferSetup(job) === setup).length;
    document.querySelector(`#${setup}-count`).textContent = count;
  });
};

const renderLoading = () => {
  elements.results.replaceChildren();
  for (let index = 0; index < 3; index += 1) {
    appendText(elements.results, 'div', '', 'loading-card');
  }
  elements.count.textContent = 'Searching…';
  elements.summary.textContent = 'Querying Elasticsearch';
};

const renderError = (error) => {
  const panel = document.createElement('div');
  panel.className = 'error-state';
  appendText(panel, 'h2', 'Search is unavailable');
  appendText(panel, 'p', error.message || 'Check the API and Elasticsearch connection, then try again.');
  elements.results.replaceChildren(panel);
  elements.count.textContent = 'Request failed';
  elements.summary.textContent = 'The interface is ready, but the search service did not respond.';
};

const search = async (query) => {
  state.query = query.trim();
  if (!state.query) {
    elements.query.focus();
    return;
  }
  renderLoading();
  elements.searchButton.disabled = true;
  try {
    const response = await fetch(`/jobs/search?q=${encodeURIComponent(state.query)}`);
    if (!response.ok) throw new Error(`API returned ${response.status} ${response.statusText}`);
    const payload = await response.json();
    state.results = Array.isArray(payload) ? payload : [];
    updateFilterOptions();
    render();
  } catch (error) {
    state.results = [];
    renderError(error);
  } finally {
    elements.searchButton.disabled = false;
  }
};

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  search(elements.query.value);
});

document.querySelectorAll('[data-query]').forEach((button) => {
  button.addEventListener('click', () => {
    elements.query.value = button.dataset.query;
    search(button.dataset.query);
  });
});

document.querySelectorAll('input[name="setup"]').forEach((input) => input.addEventListener('change', render));
elements.sort.addEventListener('change', render);
elements.clearFilters.addEventListener('click', () => {
  document.querySelectorAll('.filters input').forEach((input) => { input.checked = false; });
  render();
});
elements.themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('elastic-jobs-theme', isDark ? 'light' : 'dark');
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    elements.query.focus();
  }
});

document.documentElement.dataset.theme = localStorage.getItem('elastic-jobs-theme') || 'light';
