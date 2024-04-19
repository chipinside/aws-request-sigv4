import { SignatureV4 } from "@aws-sdk/signature-v4";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Sha256 } from "@aws-crypto/sha256-js";
import querystring from 'querystring'
import core from '@actions/core';

let method = core.getInput('method');
let region = core.getInput('region');
let hostname = core.getInput('domain');
let service = core.getInput('service')
let contentType = core.getInput('content_type');
let uri = core.getInput('uri');
let body = core.getInput('payload');

const credentialProvider = fromNodeProviderChain();
const credentials = await credentialProvider();

const signer = new SignatureV4({
  credentials: credentials,
  region: region,
  service: service,
  sha256: Sha256
});

const [path, query] = uri.split('?')

const signedRequest= await signer.sign({
  path: path,
  query: querystring.parse(query || ''),
  hostname: hostname,
  body: body,
  headers: {
    host: hostname, // This is necessary.
    'Content-Type': contentType
  },
  method: method,
})

function headersToJSON(headers) {
  const headersObj = {};
  headers.forEach((value, name) => {
    headersObj[name] = value;
  });
  return headersObj;
}

fetch(
  `https://${hostname}${uri}`, signedRequest
).then(async (response) => {
  const body = await response.text();
  const headers = headersToJSON(response.headers)
  core.info(body);
  core.info(JSON.stringify(headers));
  core.info(response.status.toString())
  core.setOutput('body', body)
  core.setOutput('headers', JSON.stringify(headers))
  core.setOutput('status', response.status)
}, (error) => {
  core.setFailed(error);
});
