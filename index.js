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
  activate: new Packet(Buffer.from('CI03')),
  deactivate: new Packet(Buffer.from('CI1')),
  status: new Packet(Buffer.from('CI2')),
}

const SAMControl = {
  activate: new Packet(Buffer.from('CI@')),
  deactivate: new Packet(Buffer.from('CIA')),
  status: new Packet(Buffer.from('CIB')),
}

async function main(command) {
  var device = await HID.HIDAsync.open(VID, PID);

  device.on("data", function(data) {
    const response = Response.deserialize(data);

    // If a command was given, do nothing else
    if (command?.length > 0) {
      console.log('Stopping after command', command);
      process.exit(0)
      return
    }

    switch (response.command) {
      case init.command:
        device.write(revision.EMV.serialize())
        break;
      case revision.EMV.command:
        if (response.pm === revision.EMV.pm) {
          device.write(statusRequest.serialize())
        }
        break;
      case statusRequest.command:
        device.write(entry.serialize())
        break;
      case entry.command:
        device.write(retrieve.serialize())
        break;
      case retrieve.command:
        device.write(ICContact.set.serialize())
        break;
      case ICContact.set.command:
        if (response.pm === ICContact.set.pm) {
          device.write(ICCardControl.activate.serialize())
        } else if (response.pm === ICContact.release.pm) {
          device.write(CardCarry.capture.serialize())
        }
        break;
      case ICCardControl.activate.command:
        if (response.pm === ICCardControl.activate.pm) {
          if (response.positive) {
            device.write(ICCardControl.status.serialize())
          } else {
            device.write(ICContact.release.serialize())
          }
        } else if (response.pm === ICCardControl.status.pm) {
          // device.write(ICCardControl.deactivate.serialize())
        } else if (response.pm === ICCardControl.deactivate.pm) {
          device.write(ICContact.release.serialize())
        }
        break;
      case CardCarry.capture.command:
        if (response.pm === CardCarry.capture.pm) {
          device.write(entry.serialize())
        }
        break;
      }

  });
  device.on("error", function(error) {
    console.log("error", error);
  });

  if (command === 'init') {
    device.write(init.serialize())
  } else {
    device.write(init.serialize())
  }

}

// Assumes [0]'node' [1]'index.js'
main(process.argv[2])
