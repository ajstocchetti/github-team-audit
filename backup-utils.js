const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {orgName,getTeamsForOrg,getReposForTeam} = require('./utils.js');

module.exports = {
  backupTeam,
  cloneRepo,
};

async function backupTeam(teamId) {
  const repos = await getReposForTeam(teamId);
  repos.forEach(async repo => await cloneRepo(repo));
}

async function cloneRepo(repoApiResp) {
  const { name, ssh_url } = repoApiResp;
  try {
    console.log(`Downloading repo ${name}`);
    const repoDir = path.resolve(__dirname, 'repos', name);
    if (fs.existsSync(repoDir)) {
      repull(repoDir);
    } else {
      execSync(`git clone ${ssh_url} ${repoDir}`);
    }
  } catch(err) {
    console.log(`Error downloading repo ${name}:`, err);
  }
}

function repull(dirname) {
  const here = path.resolve(__dirname);
  execSync(`cd ${dirname} && git pull && cd ${here}`);
}