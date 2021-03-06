const noble = require('noble');
const table = require('tty-table');

function render(rows) {
  const config = {};
  const cols = [
    {
      value: 'id', alias: 'ID',
      headerAlign: 'left', align: 'left', paddingLeft: 1, paddingRight: 0,
      formatter: value => config[value] || value
    },
    // { value: 'rssi', alias: 'RSSI' },
    { value: 'humidity', alias: 'Humidity %', formatter: n => n.toFixed(1) },
    { value: 'temperature', alias: 'Temperature °C', formatter: n => n.toFixed(2) },
    { value: 'pressure', alias: 'Pressure hPa', formatter: n => n.toFixed(1) },
    { value: 'battery', alias: 'Battery mV', formatter: n => n.toFixed(0) },
    { value: 'acceleration', alias: 'Acceleration mG', formatter: a => `x:${a.x} y:${a.y} z:${a.z}` },
    { value: 'updates', alias: 'Updates' }
  ];
  cols.forEach(c => {
    const lengths = rows.map(r => {
      const formatter = c.formatter || function(s) { return s };
      return ('' + formatter(r[c.value])).length;
    }).concat(c.alias.length);
    c.width = Math.max(...lengths) + 3;
  });
  const output = table(cols, rows, [], {
    borderStyle: 1,
    compact: true,
    headerAlign: 'right',
    align: 'right',
    paddingLeft: 0,
    paddingRight: 1
  }).render();
  console.clear();
  console.log(output);
}

const parse = {
  humidity(str) {
    return parseInt(str, 16) / 2;
  },
  temperature(str) {
    let val = parseInt(str.slice(0, 2), 16) + parseInt(str.slice(2), 16) / 100;
    return val > 128 ? 128 - val : val;
  },
  pressure(str) {
    return parseInt(str, 16) / 100 + 500;
  },
  acceleration(str) {
    let val = parseInt(str, 16);
    return val > 32767 ? val - 65536 : val;
  },
  battery(str) {
    return parseInt(str, 16);
  }
}

Object.keys(parse).forEach(key => {
  let fn = parse[key];
  parse[key] = (str, from, to) => {
    let val = fn(str.slice(from, to));
    return +val.toFixed(2);
  }
});

var rowsById = {};

noble.on('discover', peripheral => {
  const str = (peripheral.advertisement.manufacturerData || '').toString('hex');
  if (!str.startsWith('9904')) return;
  let row = rowsById[peripheral.id];
  if (!row) {
    row = { id: peripheral.id, updates: 0 };
    rowsById[row.id] = row;
  }
  Object.assign(row, {
    rssi: peripheral.rssi,
    humidity: parse.humidity(str, 6, 8),
    temperature: parse.temperature(str, 8, 12),
    pressure: parse.pressure(str, 12, 16),
    acceleration: {
      x: parse.acceleration(str, 16, 20),
      y: parse.acceleration(str, 20, 24),
      z: parse.acceleration(str, 24, 28),
    },
    battery: parse.battery(str, 28, 32)
  });
  row.updates++;
  render(Object.values(rowsById));
});

noble.startScanning([], true);
