# client-server-communicator
Prove Of Concept - Client finds server on the network > Client and server communicate with each other

## idea

This idea is that we have a client running some software that needs to communicate with a server to execute certain tasks.
We can do this 2 obvius ways. 

### manual

We can enter the IP manually, which works quite well. 
But if any of the IP's changes, you need to redo this process.

Althought this works the easiest, for an end user this can be quite the hassle, and could mean an uninstall of the software.

### automatic

An automatic way could be that we search for the server software on the network.
This is way easier for the end user but could be slower on setup. 

Because its slower on setup, but easier to use I'd like to explore this setup.

## requirements

We are going to write this POC fully in NodeJS because I'm most convertable with NodeJS. But the concept should work in any language.

### Default port

We are going to need a default port where our application runs on.
This is to make it easy for the end user to get the application up and running.
This port is being used to search the network.

### Security

To ensure not everyone can talk to the server, we want to have some sort of security in place.
I was thinking about the following flow to make it as easy as possible:
- Client found server
- Client request to connect to the server
- Server generates a code
- Server shows code to end user
- Server asks the client to give the code 
- End user enters code into client
- Client sends the code to the server
- Server returns a JWT to the client
- Client has connection to the server

### Server

We are going to need a server that runs on the default port.

### Client

The client searches for the server by searching the network, once found it need to authenticate using a special code.
Once this code it send a JWT is returned.

## Run it!

1. Run the server: `npm run server`
2. Run the client: `npm run client`
    - When ask for a client code, copy from server console.
3. A secure connection between the server and the client is made.