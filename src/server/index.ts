import { NetworkInterfaceInfo, networkInterfaces } from "os";
import express, { Request, Response } from "express";
import { DEFAULT_PORT, CONNECTION_STRING } from "../common/constants";
import { nanoid } from "nanoid";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";

const app = express();
app.use(bodyParser.json());

const getRequestId = (request: Request): string | undefined => {
  return request.socket.remoteAddress;
};

app.get("/ping", (req: Request, res: Response) => {
  res.send(CONNECTION_STRING);
});

const codes: any = {};

app.get("/create-code", async (req: Request, res: Response) => {
  const clientIp = getRequestId(req);
  if (clientIp) {
    const code = await nanoid(8);
    codes[clientIp] = code;
    console.log(`Client code: ${code}`);
    res.send("done");
  } else {
    res.statusCode = 400;
    res.send("Unknown client ip");
  }
});

const SECRET = "ThisIsSomeAmazingSecret";

app.post("/validate-code", (req: Request, res: Response) => {
  const clientIp = getRequestId(req);
  const { code = false } = req.body;
  if (clientIp && code && code === codes[clientIp]) {
    const token = jwt.sign(
      {
        expectedIp: clientIp,
      },
      SECRET
    );
    console.log(`jwt: ${token}`);
    res.send(token);
  } else {
    res.statusCode = 400;
    res.send("Incorrect code");
  }
});

app.post("/validate", async (req: Request, res: Response) => {
  const clientIp = getRequestId(req);
  const { token = false } = req.body;
  if (token) {
    try {
      const payload: any = jwt.verify(token, SECRET);
      const { expectedIp } = payload;
      if (expectedIp === clientIp) {
        res.send("Success!");
      } else {
        res.statusCode = 401;
        res.send("Client ip does not matches expected ip");
      }
    } catch (err) {
      res.statusCode = 401;
      res.send(err);
    }
  } else {
    res.statusCode = 400;
    res.send("Token missing");
  }
});

app.listen(DEFAULT_PORT, () => {
  console.log("Accessable from the following ports:");
  const interfaces = networkInterfaces();
  Object.values(interfaces).forEach((interfaceLinks) => {
    if (interfaceLinks) {
      interfaceLinks.forEach((link) => {
        const { family, address, internal } = link;
        if (!internal && family === "IPv4") {
          console.log(`\t- ${address}:${DEFAULT_PORT}`);
        }
      });
    }
  });
});
