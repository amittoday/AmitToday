const axios = require('axios');
const url = process.env.GAS_WEBAPP_URL || "https://script.google.com/macros/s/AKfycby5t9pQYOPP_U1B-dD0R8kL6L_FXYgC49bYw3x2k59YwF3qj7Y7-W5H5rLw2t2h_1-9/exec";
const token = "my-super-secret-token"; // or whatever

axios.post(url, {
  token: token,
  action: 'ACTION_GET_COLLECTION',
  body: { tab: 'OfficeHours' }
}).then(console.log).catch(console.error);
