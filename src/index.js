import Promise from 'bluebird';
import CommitCache from './commit_cache';
import revList from './rev_list';

function promisifyGithubClient(client) {
  return {
    pullRequest: Promise.promisify(client.pullRequests.get),
    getCommits: Promise.promisify(client.repos.getCommits),
  };
}

class CommitFetcher {
  constructor(githubClient) {
    this.github = promisifyGithubClient(githubClient);
  }

  revList(user, repo, reachableFrom, notReachableFrom) {
    const getCommitList = sha => this.github.getCommits({ user, repo, sha, per_page: 100 });
    const commitCache = new CommitCache(getCommitList);
    return revList(commitCache, reachableFrom, notReachableFrom);
  }

  getAllCommits(user, repo, number) {
    return this.github.pullRequest({ user, repo, number })
    .then(pr => {
      const headSha = pr.head.sha;
      const baseSha = pr.base.sha;
      return this.revList(user, repo, [headSha], [baseSha]);
    });
  }
}

module.exports = CommitFetcher;
