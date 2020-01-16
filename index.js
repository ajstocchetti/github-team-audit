const {
  getUsersNoTeam,
  getReposNoTeam,
} = require('./utils');

const orgName = process.env.ORG || 'servercentral';

getUsersNoTeam(orgName);
getReposNoTeam(orgName);
