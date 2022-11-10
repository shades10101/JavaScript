const assert = require('assert');
const ping = require('net-ping');

const failures = [];

const session = ping.createSession({
  retries: 2,
  timeout: 1000
});

let checksCompleted = 0;

// Hosts are numbers in this example, but this could be replaced with a meaningful label for each host instead.
const checks = [ { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' },
                 { 'host': 'server##', 'ip': 'IP_ADDRESS' }]

function checkEndpoint(item) {
  session.pingHost(item.ip, function (error, target, sent, rcvd) {
    if (error) {
      failures.push(item.ip);
      console.log('ERROR - Ping failed for host ' + item.host + ' (IP ' + item.ip + ') with error: ' + error);
    }
    else {
      const timeRequired = rcvd - sent
      console.log('Ping successful for host ' + item.host + ' (IP ' + item.ip + '). Response (ms): ' + timeRequired)
    }

    checksCompleted++
    if (checksCompleted == checks.length) {
      session.close();
      if (failures.length !=0) {
        throw new Error("ERROR - " + failures.length + "/" + checks.length + " endpoints failed. Failures: " + failures);
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
// Check each endpoint
checks.forEach(checkEndpoint);