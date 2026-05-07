module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'perf', 'test', 'docs', 'chore',
      'build', 'ci', 'style', 'revert',
    ]],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [0],  // allow any case in subject
    'body-max-line-length': [0],  // allow long bodies (Co-Authored-By lines)
  },
};
