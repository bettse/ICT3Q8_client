const HID = require('node-hid');
const Packet = require('./Packet');
const Response = require('./Response');

const PID = 0x100C;
const VID = 0x077A;

const init = new Packet(Buffer.from('C000'))
const statusRequest = new Packet(Buffer.from('C11'));

async function main() {
  var device = await HID.HIDAsync.open(VID, PID);

  device.on("data", function(data) {
    console.log("data", data.toString('ascii'), data.toString('hex'));
    const response = Response.deserialize(data);
    console.log(response);
  });
  device.on("error", function(error) {
    console.log("error", error);
  });

  device.write(init.serialize())

}

main()
