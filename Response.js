const { crc16xmodem } = require('crc');
const Packet = require('./Packet');
const debug = require('debug')('CRT310:Response');

const HEX = 0x10

const STX = 0x04
const ACK = 0x06

class Response extends Packet {
  constructor(text) {
    super(text);
    this.positive = (text[0] === 0x50) // ('P')
    if (this.positive) {
      this.statusCode = text.slice(3, 5).toString('ascii')
    } else {
      this.errorCode = text.slice(3, 5).toString('ascii')
    }
  }

  static deserialize(data) {
    // 06 f2 00 06 50 30 30 30 30 78 1c 17
    // ack (0x06) is removed before deserialize is called
    if (data.length < 3) {
        // header not complete
        return null;
    }
    if (data[0] !== STX) {
      console.log('incorrect first byte', data[0].toString(HEX).padStart(2, '0'), data);
      return null;
    }
    const length = data.readUInt16BE(1);
    if (data.length < 1 + 2 + length + 2) {
      //console.log('incomplete based on length');
      return null;
    }
    const text = data.slice(3, 3 + length);
    const crc = crc16xmodem(data.slice(0, 3 + length))
    if (crc != data.readUInt16BE(data.length - 2)) {
      // console.log('incorrect crc');
    }

    const response = new Response(text);
    debug(response)
    return response
  }
}

module.exports = Response;
