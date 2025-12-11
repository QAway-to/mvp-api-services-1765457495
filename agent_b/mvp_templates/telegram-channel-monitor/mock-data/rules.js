export default [
  {
    id: 1,
    name: 'Python Keywords',
    rule_type: 'keywords',
    pattern: 'python, telegram, bot',
    is_active: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    name: 'Regex Pattern',
    rule_type: 'regex',
    pattern: '\\b(?:python|javascript|react)\\b',
    is_active: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

