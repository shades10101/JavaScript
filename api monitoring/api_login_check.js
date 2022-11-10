const assert = require('assert'); 
const request = require('request');

GetSystems()

function GetSystems() {
  const options = {
  'method': 'POST',
    'url': '$secure.NEWRELIC_ENV_VARIABLE', //API url
    'headers': {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "username": $secure.NEWRELIC_ENV_VARIABLE,
      "password": $secure.NEWRELIC_ENV_VARIABLE
})
};

  $http(options, (error, response, body) =>{

    if (error) console.error('Error:', error);

    const data = JSON.parse(body.trim())
    const status = JSON.stringify(data.status);
    const token = data.data.token
    const return_errors = data.error
    console.log(`HTTP Body is: ${body}`)
    console.log(`error is: ${return_errors}`)
    console.log(`response is: ${response}`)
    console.log(`Status of API is ${status}`)
    console.log(`Token is ${token}`)

    // Check if HTTP is 200 & token is defined  
    if (typeof token === 'undefined' || !(status.includes(`200`))) {
      
      console.log(`Failed: API is down`)
      throw new Error(`API is down - token is ${token} and HTTP: ${status} response code`);
                      
    } else if  (typeof return_errors != 'undefined') {
    
      console.log(`API returned an error`)
      throw new Error(`API returned an error - ${return_errors}`);
      
    } else if (typeof token != 'undefined' && status.includes(`200`)) {

      console.log(`Passed all checks`)
      assert.ok(`API is up, received token and the HTTP response is ${status}}`)
      
    }
})
}