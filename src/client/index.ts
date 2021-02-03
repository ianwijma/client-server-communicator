import { DEFAULT_PORT, CONNECTION_STRING } from "../common/constants";
import IPCIDR from "ip-cidr";
import { networkInterfaces } from "os";
import fetch, { Body, RequestInfo, RequestInit, Response } from "node-fetch";
import inquirer from "inquirer";

const getCIDRs = () => {
  const cidrs: string[] = [];

  const interfaces = networkInterfaces();
  Object.values(interfaces).forEach((interfaceLinks) => {
    interfaceLinks?.forEach((links) => {
      const { internal, cidr, family } = links;
      if (!internal && cidr && family === "IPv4") {
        cidrs.push(cidr);
      }
    });
  });

  return cidrs;
};

const getIpAddresses = (externalCIDRs: string[]) => {
  let externalIps: string[] = [];

  externalCIDRs.forEach((cidrString) => {
    const cidr = new IPCIDR(cidrString);
    if (!cidr.isValid()) throw new Error(`Invalid CIDR: ${cidrString}`);
    externalIps = externalIps.concat(cidr.toArray());
  });

  return externalIps;
};

const callFetch = async (url: RequestInfo, options?: RequestInit): Promise<Response> => {
    const resp = await fetch(url, options);
    if ( resp.status !== 200 ) throw new Error(`Error caught on fetch ${await resp.text()}`);
    return resp;
}

const createPath = (ip: string, path: string = "/") => {
  return `http://${ip}:${DEFAULT_PORT}${path}`;
};

const checkIp = async (ipAddress: string): Promise<boolean> => {
  try {
    const path = createPath(ipAddress, "/ping");
    const resp = await callFetch(path, {
      timeout: 25, // Should be a bit higher, but for local development this works.
    });
    const string = await resp.text();
    return string === CONNECTION_STRING;
  } catch (err) {
    return false;
  }
};

const getServerIps = async (ipAddresses: string[]) => {
  const serverIps: string[] = [];

  let done = 0;
  for (const ipAddress of ipAddresses) {
    const isServer = await checkIp(ipAddress);
    if (isServer) serverIps.push(ipAddress);
    console.log(
      `${done++}/${
        ipAddresses.length
      }: \tChecked ${ipAddress} \tisServer: ${isServer}`
    );
  }

  return serverIps;
};

const confirmServers = async (servers: string[]) => {
  return await inquirer.prompt([
    {
      name: "server",
      message: "Confirm server",
      type: "list",
      choices: servers,
    },
  ]);
};

const requestServerToGenerateCode = (server: string) => {
  return callFetch(createPath(server, "/create-code"));
};

const validateCode = async (server: string): Promise<string> => {
  const { code = false } = await inquirer.prompt([
    {
      name: "code",
      message: "Client code",
      type: "input",
    },
  ]);

  if (code) {
    const resp = await callFetch(createPath(server, "/validate-code"), {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: {'Content-Type': 'application/json'}
      });
    
      return resp.text();
  } else {
      return await validateCode(server);
  }
};

const validateToken = (server: string, token: string) => {
    return callFetch(createPath(server, "/validate"), {
        method: "POST",
        body: JSON.stringify({ token }),
        headers: {'Content-Type': 'application/json'}
      })
}

async function bootstrap() {
  const CIDRs = getCIDRs();
  const ipAddresses = getIpAddresses(CIDRs);
  const servers = await getServerIps(ipAddresses);
  const { server } = await confirmServers(servers);
  await requestServerToGenerateCode(server);
  const token = await validateCode(server);
  await validateToken(server, token);

  console.log(`Successfull setup a secure connection with ${server}`);
}
bootstrap();

// TODO: Get network
