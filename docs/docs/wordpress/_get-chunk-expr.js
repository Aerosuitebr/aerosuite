const fs = require('fs');
const chunk = process.argv[2];
const content = fs.readFileSync(__dirname + '/deploy-encoding-' + chunk + '.js', 'utf8').trim();
process.stdout.write(JSON.stringify({ expression: content }));
