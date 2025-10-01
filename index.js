const ICT3Q8 = require('./ict3q8');

async function main() {
  const ict3q8 = await new ICT3Q8();
  await ict3q8.start();
}

main();
