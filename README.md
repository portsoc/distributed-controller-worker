# distributed controller/worker computation example

This is a simple controller-worker distributed computation system example that can be
used to test cloud deployment tools.

The client is CPU-intensive but single threaded, it requires one CPU to work best. The server is not CPU-intensive.

## Installation

```
git clone https://github.com/portsoc/distributed-controller-worker
cd distributed-controller-worker
npm install
```

To run the server, use the command below, but replace the parameter `KEY` below with a randomly generated string (at least 6 characters, see _Notes_ below):

```
npm run server KEY
```

To run a client, use the command below, providing the randomly generated string and the IP address (and optionally the port) of the server:

```
npm run client SERVER-KEY SERVER-IP-ADDRESS[:PORT]
```


### Notes

Generating a random key: in shell, you can do

```
key=`openssl rand -base64 32`
echo "$key"
```
