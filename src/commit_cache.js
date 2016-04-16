import Promise from 'bluebird';

export default class CommitCache {
  constructor(getCommitList) {
    this.commits = {};
    this.getCommitList = getCommitList;
  }

  get(sha) {
    if (sha in this.commits) {
      return Promise.resolve(this.commits[sha]);
    }

    return this.getCommitList(sha)
    .then(newCommits => {
      const newCacheEntries = {};
      for (const commit of newCommits) {
        newCacheEntries[commit.sha] = commit;
      }
      Object.assign(this.commits, newCacheEntries);
      return this.commits[sha];
    });
  }
}
