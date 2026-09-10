const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  try {
    const response = await axios.post(process.env.GAS_WEBAPP_URL, {
      token: process.env.GAS_SECRET_TOKEN,
      action: 'ACTION_SAVE_SETTINGS',
      body: { ADMIN_EMAIL: 'amitonlineservice01@gmail.com' }
    });
    console.log("Restoring admin mail:", response.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}

test();
