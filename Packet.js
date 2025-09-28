const { crc16xmodem } = require('crc');
const debug = require('debug')('CRT310:Packet');

const START = 0x04
const MAX_LEN = 300;

const ERROR_CODES = {
  '00': '',
  '01': '',
  '02': '',
  '04': '',
  '70': '',
  '71': '',
  'B0': '',
}

const CommandDescription = {
  0x30: 'init',
  0x31: 'status',
  0x32: 'entry',
  0x33: 'capture/eject',
  0x34: 'retrieve',
  0x35: 'security and spare port',
  0x36: 'Mag-Track READ',
  0x37: 'Mag-Track WRITE',

  0x3a: 'enabled/disable',
  0x40: 'ICContact',
  0x41: 'revision',
  0x49: 'ICCardControl',
}


class Packet {
  constructor(text) {
    // ? text = Buffer.from(text)
    this.text = text
    this.cm = text[1]
    this.command = CommandDescription[this.cm]
    this.pm = text[2]
    if (text.length > 5) {
      this.data = text.slice(5)
      if (this.data.length > 0) {
        this.ascii = this.data.toString('ascii')
      }
    }
  }

  serialize(payload = Buffer.alloc(0)) {
    const buffer = Buffer.alloc(64);// 1 + 2 + this.text.length + 0);
    buffer[0] = START;
    buffer.writeUInt16BE(this.text.length + payload.length, 1);
    this.text.copy(buffer, 3);
    if (payload.length > 0) {
      payload.copy(buffer, 3 + this.text.length);
    }
    //const crc = crc16xmodem(buffer.slice(0, buffer.length - 2))
    //buffer.writeUInt16BE(crc, buffer.length - 2)
    debug('serialize', buffer.toString('hex'))
    return buffer
  }
}

module.exports = Packet;
