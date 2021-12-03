const AWS = require('aws-sdk');
const core = require('@actions/core');

let method = core.getInput('method');
let region = core.getInput('region');
let domain = core.getInput('domain');
let service = core.getInput('service')
let contentType = core.getInput('content_type');
let uri = core.getInput('uri');
let payload = core.getInput('payload')

let endpoint = new AWS.Endpoint(domain);
let request = new AWS.HttpRequest(endpoint, region);

core.info(payload)

request.method = method;
request.path = uri;
request.body = payload;
request.headers['host'] = domain;
request.headers['Content-Type'] = contentType;
request.headers['Content-Length'] = Buffer.byteLength(request.body);

let credentials = new AWS.EnvironmentCredentials('AWS');
let signer = new AWS.Signers.V4(request, service);
signer.addAuthorization(credentials, new Date());

let client = new AWS.HttpClient();

new Promise(async (resolve, reject) => {

  client.handleRequest(request, null, function(response) {
    let status = response.statusCode
    let headers = response.headers
    let body = ''
    response.on('data', (buffer) => { body += buffer })
    response.on('end', () => { resolve({body, status, headers}) })
  }, reject);

}).then((response) => {
  core.info(response.body)
  core.info(JSON.stringify(response.headers))
  core.info(response.status)
  core.setOutput('body', response.body)
  core.setOutput('headers', JSON.stringify(response.headers))
  core.setOutput('status', response.status)
}).catch((err) => {
  core.setFailed(err);
})

