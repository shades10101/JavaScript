const assert = require('assert'); 
const application_Servers = [];
const failures = [];
let counter = 0;
const spare_servers = [];

GetSystems('app_name','us-east-1', 'PROD')

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

    servers.forEach((server) => {
      if (server.includes(`qa`)) {

        spare_servers.push(server)
        console.log(`Found spare server: ${server} - this will be excluded from the check.`)

      } else {

        application_Servers.push(`http://${server}:8080/speed_test.html`);

      }
    });
    console.log(`The amount of servers queried is ${servers.length} and they are:`)
    console.log(servers)
    application_Servers.forEach((value) => TestEndpoint(value));
  }) 
}
const option = { 
    timeout: 4999 
} 

function TestEndpoint(item){ 
  $http.get(item, option, (error, response, body) => { 

    if (error) {

      failures.push(`${item}: ${error}`)
      console.log(`Server ${item} http connection time was longer then 5 seconds `)     
    
    } else {

    assert.ok(`Server ${item} http connection time was lower then 5 seconds`) 
    console.log(`Server ${item} http connection time was lower then 5 seconds`)
    
    }

    counter++
    
    if (counter == application_Servers.length) {
      if (failures.length !=0) {
        throw new Error(`ERROR - ${failures.length} / ${application_Servers.length} endpoints failed. Failures: ${failures}`);
    }
      else {
        console.log(`All checks were successful. Skipped: ${spare_servers}`);
      }
    }
    else {
      console.log("...")
    }  
  })};