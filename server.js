const ruuvi = require('node-ruuvitag');
const table = require('tty-table');

const config = {
  'a33fa6e3a91546b9b56dcb597925cd0a': 'Korjaamo',
  '61f62c2dc0df4a2ab44a1e852bfa434b': 'Verstas',
  'f160631cd2cd47f4b734bbd5435f02ac': 'Tupa',
  'a79066cbd8c142f59bba4e3515a8389c': 'Lintulauta',
  '03e7e7acc86a4cd7a77c4807b3c74ee9': 'Olohuone'
};

const format = {
  num(decimals, divider = 1) {
    return value => (value / divider).toFixed(decimals)
  },
  default(value) {
    return value;
  }
}

const cols = [
  { 
    value: 'id', 
    alias: 'ID',
    headerAlign: 'left', 
    align: 'left', 
    paddingLeft: 1, 
    paddingRight: 0,
    formatter(value) {
      return config[value] || value.slice(-6);
    }
  },
  // { value: 'url', alias: 'URL' },
  // { value: 'dataFormat', alias: 'Format' },
  // { value: 'rssi', alias: 'RSSI' },
  { value: 'humidity', alias: 'Humidity %', formatter: format.num(1) },
  { value: 'temperature', alias: 'Temperature °C', formatter: format.num(2) },
  { value: 'pressure', alias: 'Pressure hPa', formatter: format.num(1, 100) },
  { value: 'battery', alias: 'mV' },
  { value: 'accelerationX', alias: 'X' },
  { value: 'accelerationY', alias: 'Y' },
  { value: 'accelerationZ', alias: 'Z' },
  { value: 'updates', alias: 'Updates' }
];

var rows = [];

ruuvi.on('found', tag => {
  var row = { id: tag.id, updates: 0 };
  rows.push(row);
  tag.on('updated', data => {
    row.updates++;
    cols.forEach(c => {
      // Update values
      if (!['id', 'updates'].includes(c.value)) {
        row[c.value] = data[c.value];
      }
      // Calculate column widths
      const lengths = rows.map(r => {
        const formatter = c.formatter || format.default;
        return ('' + formatter(r[c.value])).length;
      }).concat(c.alias.length);
      c.width = Math.max(...lengths) + 3;
    });
    const str = table(cols, rows, [], {
      borderStyle: 1,
      compact: true,
      headerAlign: 'right',
      align: 'right',
      paddingLeft: 0,
      paddingRight: 1
    }).render();
    console.clear();
    console.log(str);
  });
});

