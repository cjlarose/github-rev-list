# github-rev-list

Implementation of [`git rev-list`][rev-list] over the Github API.

[rev-list]: https://git-scm.com/docs/git-rev-list

## Usage

`CommitFetcher`'s constructor accepts an instance of `GithubApi` from [`node-github`][node-github].

[node-github]: https://github.com/mikedeboer/node-github

### Remote rev-list

```javascript
const GithubApi = require('github');
const CommitFetcher = require('github-rev-list');

const github = new GithubApi({ version: '3.0.0' });
const cf = new CommitFetcher(github);

cf.getAllCommits({ user: 'home-assistant',
                   repo: 'home-assistant',
                   reachableFrom: ['3bdf7eabbf2fb2ed05c6ec6bf96072a30060eee8'],
                   notReachableFrom: ['29b6782b424f122d17988a20e405b45fb6cba003'] })
.then(commits => {
  for (const commit of commits) {
    console.log(commit.sha);
  }
});
```

### Fetching all commits of a large pull request

The [Github Pull Request API][pr-api] will return at most 250 commits. Using `github-rev-list`, however, you can retrieve the complete list of commits.

[pr-api]: https://developer.github.com/v3/pulls/#list-commits-on-a-pull-request

```javascript
const GithubApi = require('github');
const CommitFetcher = require('github-rev-list');

const github = new GithubApi({ version: '3.0.0' });
const cf = new CommitFetcher(github);

cf.getAllCommits({ user: 'home-assistant',
                   repo: 'home-assistant',
                   number: 1365 })
.then(commits => {
  for (const commit of commits) {
    console.log(commit.sha);
  }
});
```
