const assert = require('assert');
const ping = require('net-ping');
const { Resolver } = require('dns');
const myResolver = new Resolver();

// Make sure this address below is a production DNS server.
myResolver.setServers([`${$secure.DNS_SERVER_IP}`])

const lookups = [];
const failures = [];
const checks = [];
const spare_servers = [];

let checksCompleted = 0;
let lookUpsCompleted = 0;
let hostCounter = 0;
const session = ping.createSession({
    retries: 2,
    timeout: 1000
});

GetSystems('application_server','us-east-1', 'PROD')

function GetSystems(service, dataCentre, environment) {
  const options = {
    'method': 'GET',
    'url': `https://insights-api.newrelic.com/v1/accounts/$secure.ACCNUMBER/query?nrql=SELECT uniques(hostname) FROM SystemSample LIMIT MAX SINCE 1 week ago WHERE service = \'${service}\' AND dataCenter = \'${dataCentre}\' AND environment = \'${environment}\'`,
    'headers': {
      'Accept': 'application/json',
      'X-Query-Key': $secure.XQUERYKEY
    }
  }

  $http(options, (error, response, body) =>{
    if (error) console.error('Error:', error);
    
    const data = JSON.parse(body.trim()) 
    const servers = data.results[0].members;

    if (servers.length < 1) {
      console.log(`There was an error, 0 servers were queried from New Relic`)
      throw new Error(`0 servers were queried from New Relic`)
    }

    servers.forEach((server) => {
       if (server.includes(`spare`) || server.startsWith(`qa`)) {
  
          spare_servers.push(server)
          console.log(`Found Spare/QA server: ${server} - this will be excluded from the check.`)
  
        } else {
  
          lookups.push(`${server}`);
  
        }
    });
    
    console.log(`New Relic was able to query ${lookups.length} servers, and they are ${lookups}`)
    lookups.forEach(checkLookup);

  })
} 

function checkLookup(item)
{
  myResolver.resolve4(item, function(err, addresses) {
    if (err) {
      console.log(`An error occurred while looking up ${item} on: ${err}`)
      assert.fail(`This is a DNS related issue, please check if there is a A record for ${item}, and if the new relic minion server can query the record.`)
    }
    
    let ip = addresses.toString();
    checks.push(ip)
    console.log(`Resolver: ${item} Result: ${addresses}`);
    lookUpsCompleted++
  
    // Are we done checking all lookups?
    if (lookUpsCompleted == lookups.length)
    {
        checks.forEach(checkEndpoint);
    }
    else
    {
      console.log("More resolutions to complete. Continuing...");
    }
  })
}

function checkEndpoint(item) {
  session.pingHost(item, function (error, target, sent, rcvd) {
    if (error) {
      failures.push(lookups[hostCounter]);
      console.log(`ERROR - Ping failed for host ${lookups[hostCounter]} with error: ${error}`);
    }
    else {
      const timeRequired = rcvd - sent
      console.log(`Ping successful for host ${lookups[hostCounter]} Response (ms): ${timeRequired}`)
    }

    checksCompleted++
    hostCounter++
    
    if (checksCompleted == checks.length) {
      session.close();
      if (failures.length !=0) {
        throw new Error(`ERROR - ${failures.length} / ${checks.length} endpoints failed. Failures: ${failures}`);
      }
      else {
        console.log("All checks were successful.");
      }
    }
    else {
      console.log("More checks to complete. Continuing...");
    }
  })
}