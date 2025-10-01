const HID = require('node-hid');
const Packet = require('./Packet');
const Response = require('./Response');

const PID = 0x100C;
const VID = 0x077A;

const init = new Packet(Buffer.from('C000'))
const statusRequest = new Packet(Buffer.from('C11'));
const entry = new Packet(Buffer.from('C20'));
const retrieve = new Packet(Buffer.from('C40'));

const revision = {
  User: new Packet(Buffer.from('CA0')),
  EMV: new Packet(Buffer.from('CA1')),
}

const withdraw = new Packet(Buffer.from('C90'));
const intake = new Packet(Buffer.from('C91'));

const enable = new Packet(Buffer.from('C:2'));
const disable = new Packet(Buffer.from('C:1'));

const CardCarry = {
  eject: new Packet(Buffer.from('C30')),
  capture: new Packet(Buffer.from('C31')),
}

const ICContact = {
  set: new Packet(Buffer.from('C@0')),
  release: new Packet(Buffer.from('C@2')),
}

const ICCardControl = {
  activate: new Packet(Buffer.from('CI05')), // 0 = active, 3 = +5V in line with ISO/IEC 7816-3
  deactivate: new Packet(Buffer.from('CI1')),
  status: new Packet(Buffer.from('CI2')),
  t0: new Packet(Buffer.from('CI3')),
}

const SAMControl = {
  activate: new Packet(Buffer.from('CI@')),
  deactivate: new Packet(Buffer.from('CIA')),
  status: new Packet(Buffer.from('CIB')),
}


const APDU = {
  // 315041592E5359532E4444463031
  '1PAY.SYS': Buffer.from('00a404000E315041592e5359532e4444463031', 'hex'),
}

class ICT3Q8 {
  constructor() {
    return new Promise(async (resolve, reject) => {
      try {
        this.device = await HID.HIDAsync.open(VID, PID);

        this.device.on("data", this.onData.bind(this));
        this.device.on("error", function(error) {
          console.log("error", error);
        });
      } catch (ex) {
        return reject(ex);
      }
      resolve(this);
    });
  }

  start() {
    this.device.write(init.serialize())
  }

  onData(data) {
    const response = Response.deserialize(data);

    switch (response.command) {
      case init.command:
        this.device.write(revision.EMV.serialize())
        console.log('Command executed: init -> revision.EMV');
        break;
      case revision.EMV.command:
        if (response.pm === revision.EMV.pm) {
          this.device.write(statusRequest.serialize())
          console.log('Command executed: revision.EMV -> statusRequest');
        }
        break;
      case statusRequest.command:
        this.device.write(entry.serialize())
        console.log('Command executed: statusRequest -> entry');
        break;
      case entry.command:
        this.device.write(retrieve.serialize())
        console.log('Command executed: entry -> retrieve');
        break;
      case retrieve.command:
        this.device.write(ICContact.set.serialize())
        console.log('Command executed: retrieve -> ICContact.set');
        break;
      case ICContact.set.command:
        if (response.pm === ICContact.set.pm) {
          this.device.write(ICCardControl.activate.serialize())
          console.log('Command executed: ICContact.set -> ICCardControl.activate');
        } else if (response.pm === ICContact.release.pm) {
          this.device.write(CardCarry.capture.serialize())
          console.log('Command executed: ICContact.set -> CardCarry.capture');
        }
        break;
      case ICCardControl.activate.command:
        if (response.pm === ICCardControl.activate.pm) {
          if (response.positive) {
            this.device.write(ICCardControl.status.serialize())
            console.log("ATR:", response.data?.toString('hex'))
            console.log('Command executed: ICCardControl.activate -> ICCardControl.status');
          } else {
            this.device.write(ICContact.release.serialize())
            console.log('Command executed: ICCardControl.activate -> ICContact.release');
          }
        } else if (response.pm === ICCardControl.status.pm) {
          this.device.write(ICCardControl.t0.serialize(APDU['1PAY.SYS']))
          // device.write(ICCardControl.deactivate.serialize())
        } else if (response.pm === ICCardControl.deactivate.pm) {
          this.device.write(ICContact.release.serialize())
          console.log('Command executed: ICCardControl.activate -> ICContact.release');
        } else if (response.pm === ICCardControl.t0.pm) {
          if (response.positive) {
            console.log('APDU Response:', response.data?.toString('hex'))
            if (response.data?.length > 2) {
              const SW = response.readUInt16BE(response.data.length - 2)
              console.log('SW:', SW.toString(16))

            }
          }
        }
        break;
      case CardCarry.capture.command:
        if (response.pm === CardCarry.capture.pm) {
          this.device.write(entry.serialize())
          console.log('Command executed: CardCarry.capture -> entry');
        }
        break;
    }
  }

}

module.exports = ICT3Q8;
