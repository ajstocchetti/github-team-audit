const {backupTeam} = require('./backup-utils.js');

(async () => {
  await backupTeam(process.env.TEAM_ID);
})();