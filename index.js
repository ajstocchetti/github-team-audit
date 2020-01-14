require('dotenv').config();
const superagent = require('superagent');
const authHeader = `token ${process.env.GITHUBOAUTHKEY}`;
const userAgent = `$process.env.GH_USER/servercentral`;
// get users for org
// get teams for org
// get repos for org

// get users not in team
// get repos not in team


function prepGhReq(url) {
  return superagent.get(url)
    .set('User-Agent', userAgent)
    .set('Authorization', authHeader)
    .set('Accept', 'application/vnd.github.v3.full+json');
}

async function getData(url, existing = []) {
  const res = await prepGhReq(url);
  const data = [...existing, ...res.body];
  const nextUrl = getNextUrl(res);
  if (nextUrl) return getData(nextUrl, data);
  else return data;
}

function getNextUrl(res) {
  if (!res.headers || !res.headers.link) return null;
  const arr = res.headers.link.split(',');
  for (let x=0; x < arr.length; x++) {
    const links = arr[x].split('; ');
    if (links[1] === 'rel="next"') return cleanLink(links[0]);
  }
  // if we got here, there was no "next"
  return null;
}

function cleanLink(link) {
  return link.trim().slice(1,-1)
}

const simplify = arr => arr.map(x => ({name: x.name, id: x.id}));


async function getUsersForOrg(orgId) {
  try {
    return await getData(`https://api.github.com/orgs/${orgId}/members?per_page=100`);
  } catch (err) {
    console.error(err);
  }
}

function usersToList(usersResponse) {
  return usersResponse.map(b => ({login: b.login, id: b.id, teams: []}));
}

async function getTeamsForOrg(orgId) {
  try {
    return getData(`https://api.github.com/orgs/${orgId}/teams?per_page=100`);
  } catch (err) {
    console.error(err);
  }
}

async function getReposForOrg(orgId) {
  try {
    return await getData(`https://api.github.com/orgs/${orgId}/repos?per_page=100`)
  } catch (err) {
    console.error(err);
  }
}

async function getReposForTeam(teamId) {
  try {
    return await getData(`https://api.github.com/teams/${teamId}/repos?per_page=100`);
  } catch (err) {
    console.error(err);
  }
}

async function getUsersForTeam(teamId) {
  try {
    return await getData(`https://api.github.com/teams/${teamId}/members?per_page=100`);
  } catch (err) {
    console.error(err);
  }
}

async function getUsersNoTeam(org) {
  const [uAll, tAll] = await Promise.all([
    getUsersForOrg(org),
    getTeamsForOrg(org),
  ]);
  const users = usersToList(uAll);
  const teams = simplify(tAll);

  for (let x = 0; x < teams.length; x++) {
    const team = teams[x];
    const tusers = await getUsersForTeam(team.id);
    tusers.forEach(tU => {
      users.forEach(oU => {
        if (tU.id == oU.id) oU.teams.push(team.name);
      });
    });
  }

  const noTeams = users.filter(u => u.teams.length === 0);
  console.log('Users not assigned to a team:');
  console.log(noTeams);
}

async function getReposNoTeam(org) {
  const [repos, teams] = await(Promise.all([
    getReposForOrg(org),
    getTeamsForOrg(org),
  ]));
  repos.forEach(r => r.teams = []);

  for (let x = 0; x < teams.length; x++) {
    const team = teams[x];
    const teamRepos = await getReposForTeam(team.id);
    teamRepos.forEach(tR => {
      repos.forEach(oR =>{
        if (tR.id == oR.id) oR.teams.push(team.name);
      });
    });
  }

  const noTeams = repos.filter(r => r.teams.length === 0).map(r => ({
    name: r.name, id: r.id, full_name: r.full_name}));
  console.log('Repos not assigned to a team:');
  console.log(noTeams);
}


getUsersNoTeam('servercentral');
getReposNoTeam('servercentral');
