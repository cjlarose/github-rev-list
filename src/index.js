import Promise from 'bluebird';
import PriorityQueue from 'priorityqueuejs';
import CommitCache from './commit_cache';

function promisifyGithubClient(client) {
  return {
    pullRequest: Promise.promisify(client.pullRequests.get),
    getCommits: Promise.promisify(client.repos.getCommits),
  };
}

async function revList(commitCache, reachableFrom, notReachableFrom) {
  const keepShas = {};
  for (const commit of reachableFrom) {
    keepShas[commit] = true;
  }
  for (const commit of notReachableFrom) {
    keepShas[commit] = false;
  }

  const pqueue = new PriorityQueue((a, b) =>
    new Date(a.commit.committer.date) - new Date(b.commit.committer.date));
  const continueSearching = () =>
    new Promise(resolve => {
      pqueue.forEach(commit => {
        if (keepShas[commit.sha] === true) {
          resolve(true);
        }
      });
      resolve(false);
    });
  const inQueue = (sha) =>
    new Promise(resolve => {
      pqueue.forEach(commit => {
        if (commit.sha === sha) {
          resolve(true);
        }
      });
      resolve(false);
    });

  const startingShas = reachableFrom.concat(notReachableFrom);
  const seedCommits = await Promise.all(startingShas.map(sha => commitCache.get(sha)));
  for (const commit of seedCommits) {
    pqueue.enq(commit);
  }

  while (await continueSearching()) {
    const commit = pqueue.deq();
    const keepChild = keepShas[commit.sha];

    const parents = await Promise.all(commit.parents.map(parent => commitCache.get(parent.sha)));
    for (const parent of parents) {
      if (!(parent.sha in keepShas)) { keepShas[parent.sha] = true; }
      if (!keepChild) { keepShas[parent.sha] = false; }
      if (!await inQueue(parent.sha)) { pqueue.enq(parent); }
    }
  }

  return keepShas;
}

export class CommitFetcher {
  constructor(githubClient) {
    this.github = promisifyGithubClient(githubClient);
  }

  getAllCommits(user, repo, number) {
    const getCommitList = sha => this.github.getCommits({ user, repo, sha });
    const commitCache = new CommitCache(getCommitList);
    return this.github.pullRequest({ user, repo, number })
    .then(pr => {
      const headSha = pr.head.sha;
      const baseSha = pr.base.sha;
      return revList(commitCache, [headSha], [baseSha]);
    });
  }
}
