const assert = require('assert'); 
const application_servers = [];
const failures = [];
const down_servers = [];
const spare_servers = [];
let counter = 0;

GetSystems('application','us-east-1','PROD')

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
        if (server.includes(`spare`) || server.startsWith(`qa`)) {
  
          spare_servers.push(server)
          console.log(`Found Spare/QA server: ${server} - this will be excluded from the check.`)
  
        } else {
  
          application_servers.push(`http://${server}:8080/status/`);
  
        }
      });
      console.log(`The amount of servers queried is ${servers.length}, servers being tested:`)
      console.log(application_servers)
      application_servers.forEach(TestEndpoint);

  })
}

function SecondChance(item){
  $http.get(item, function(error, response, body) {

    console.log(`Testing: ${item}`)
  
    if (typeof response === 'undefined') {

      console.log(`Failed: 'application_servers: ${item}`)
      down_servers.push(`${item}`)

     } else if (response.statusCode == 200 && response.body.includes('Database Status: Success')) { // Pass if HTTP 200 and includes test
  
      assert.ok(`Success: The logged HTTP response from ${item} was ${response.statusCode} and included Database Status: Success in the body.`)
      console.log(`Success: The logged HTTP response from ${item} was ${response.statusCode} and included Database Status: Success in the body.`)
  
     } else if (response.statusCode == 200 && !(response.body.includes('Database Status: Success'))){ // Gets 200, but doesn't include body message 
  
      console.log(`Failed: 'application_servers: ${item} is missing text in body ('Database Status: Success')`)
      down_servers.push(`${item}`)
  
      } else { // Server is unreachable
  
      down_servers.push(`${item}`)
      console.log(`The logged HTTP response from ${item} was: ${error}`)
  
      }
  }

)}
            
function TestEndpoint(item){
    $http.get(item, function(error, response, body) {
  
        console.log(`Testing: ${item}`)
  
        if (typeof response === 'undefined') {
            
          console.log(`Failed: 'application_servers: ${item}`)
          failures.push(`${item}`)
  
        } else if (response.statusCode == 200 && response.body.includes('Database Status: Success')) { // Pass if HTTP 200 and includes test
  
          assert.ok(`Success: The logged HTTP response from ${item} was ${response.statusCode} and included Database Status: Success in the body.`)
          console.log(`Success: The logged HTTP response from ${item} was ${response.statusCode} and included Database Status: Success in the body.`)
  
        } else if (response.statusCode == 200 && !(response.body.includes('Database Status: Success'))){ // Gets 200, but doesn't include body message 
  
          console.log(`Failed: 'application_servers: ${item} is missing text in body ('Database Status: Success')`)
          failures.push(`${item}`)
  
        } else { // Server is unreachable
  
          failures.push(`${item}`)
          console.log(`The logged HTTP response from ${item} was: ${error}`)
  
        }
  
        counter++
  
        if (counter == application_servers.length) {

          console.log("#######################################")
          console.log("Below are the second chance tests")
          console.log("#######################################")

          failures.forEach(SecondChance);
  
          if (down_servers.length >=5) {
  
            throw new Error(`ERROR - ${down_servers.length} / ${application_servers.length} endpoints failed. Failures: ${down_servers}`);
  
        } else {
  
            console.log(`All checks were successful. Skipped: ${spare_servers}`);
          
          }
        } else {
  
        console.log("...")
        
      } 
  
  })};