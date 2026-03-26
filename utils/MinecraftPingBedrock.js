import { isIPv4, isIPv6 } from 'net';
import { createSocket } from 'dgram';
import dns from 'dns';
import { promisify } from 'util';

const lookupDns = promisify(dns.lookup);

const BedrockEditionPacketMagic = [
  0x00, 0xFF, 0xFF, 0x00, 0xFE, 0xFE, 0xFE, 0xFE,
  0xFD, 0xFD, 0xFD, 0xFD, 0x12, 0x34, 0x56, 0x78
];

function writeBedrockPacketPing(timestamp) {
  const timestampBuf = Buffer.alloc(8);
  timestampBuf.writeBigInt64BE(BigInt(timestamp));
  return Buffer.concat([
    Buffer.from([0x01]),
    timestampBuf,
    Buffer.from(BedrockEditionPacketMagic)
  ]);
}

function readBedrockPacketPong(buf, reject) {
  const packetId = buf.readInt8(0);
  if (packetId !== 0x1C) {
    return reject(new Error(`Bad packet id: ${packetId}`));
  }
  const timestamp = buf.readBigInt64BE(1).toString();
  const serverId = buf.readBigInt64BE(9).toString() + 'n';
  if (buf.compare(Buffer.from(BedrockEditionPacketMagic), 0, BedrockEditionPacketMagic.length, 17, 33) !== 0) {
    return reject(new Error(`Bad packet magic data: ${buf.slice(17, 33).toString('hex')}`));
  }
  const payloadLen = buf.readInt16BE(33);
  const payload = buf.slice(35, 35 + payloadLen).toString().split(/;/g);
  if (payload.length < 6) {
    return reject(new Error(`Bad packet payload entries: ${payload}. (expected: 6, current: ${payload.length})`));
  }
  const [gameId, serverName, protocolVersion, serverVersion, online, max] = payload;
  return {
    timestamp,
    serverId,
    gameId,
    serverName,
    protocolVersion,
    serverVersion,
    online,
    max,
    payload
  };
}

export async function pingBedrock(opts) {
  let ip = opts.host;
  const port = opts.port || 19132;
  if (!isIPv4(ip) && !isIPv6(ip)) {
    const address = await lookupDns(opts.host);
    ip = address.address;
  }
  return new Promise((resolve, reject) => {
    try {
      let timeout;
      const start = Date.now();
      const client = createSocket('udp4');
      client.once('error', reject);
      client.on('message', (msg, rinfo) => {
        client.close();
        timeout && clearTimeout(timeout);
        const pong = readBedrockPacketPong(msg, reject);
        if (!pong) return;
        resolve({
          host: opts.host,
          port: rinfo.port || port,
          ipv4: rinfo.address || ip,
          latency: Date.now() - start,
          description: pong.serverName,
          version: {
            name: pong.serverVersion,
            protocol: parseInt(pong.protocolVersion)
          },
          players: {
            online: parseInt(pong.online),
            max: parseInt(pong.max)
          },
          serverId: pong.serverId,
          gameId: pong.gameId,
          payload: pong.payload
        });
      });
      client.on('listening', () => {
        timeout = opts.timeout === undefined
          ? undefined
          : setTimeout(() => {
            client.close();
            reject(new Error('Timeout'));
          }, opts.timeout);
        const packet = writeBedrockPacketPing(start);
        client.send(packet, 0, packet.length, port, ip);
      });
      client.bind();
    } catch (err) {
      reject(err);
    }
  });
}
