const HID = require('node-hid');
const Packet = require('./Packet');
const Response = require('./Response');

const PID = 0x100C;
const VID = 0x077A;

const init = new Packet(Buffer.from('C000'))
const statusRequest = new Packet(Buffer.from('C11'));
const retrieve = new Packet(Buffer.from('C40'));

const revision = {
  User: new Packet(Buffer.from('CA0')),
  EMV: new Packet(Buffer.from('CA1')),
}

const withdraw = new Packet(Buffer.from('C90'));
const intake = new Packet(Buffer.from('C91'));

const enable = new Packet(Buffer.from('C:0'));
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
    if (command.length > 0) {
      process.exit(0)
      return
    }

    if (response.command === 'init') {
      device.write(revision.EMV.serialize())
    } else if (response.command === 'revision' && response.pm === revision.EMV.pm) {
      device.write(statusRequest.serialize())
    } else if (response.command === 'status') {
      device.write(retrieve.serialize())
    } else if (response.command === 'retrieve') {
      device.write(ICContact.set.serialize())
    } else if (response.command === 'ICContact' && response.pm === ICContact.set.pm) {
      device.write(ICCardControl.activate.serialize())
    } else if (response.command === 'ICCardControl' && response.pm === ICCardControl.activate.pm) {
      if (response.positive) {
        device.write(ICCardControl.status.serialize())
      } else {
        device.write(ICContact.release.serialize())
      }
    } else if (response.command === 'ICContact' && response.pm === ICContact.release.pm) { // release
      device.write(CardCarry.capture.serialize())
    } else if (response.command === 'ICCardControl' && response.pm === ICCardControl.status.pm) {
      // device.write(ICCardControl.deactivate.serialize())
    } else if (response.command === 'ICCardControl' && response.pm === ICCardControl.deactivate.pm) {
      device.write(ICContact.release.serialize())
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

main(process.argv[1])
