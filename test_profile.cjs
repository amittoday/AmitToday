const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  try {
    const response = await axios.post(process.env.GAS_WEBAPP_URL, {
      token: process.env.GAS_SECRET_TOKEN,
      action: 'ACTION_GET_USER_PROFILE',
      body: { email: 'amitonlineservice01@gmail.com' }
    });
    console.log("Profile:", response.data);
    
    const res2 = await axios.post(process.env.GAS_WEBAPP_URL, {
      token: process.env.GAS_SECRET_TOKEN,
      action: 'ACTION_GET_SETTINGS'
    });
    console.log("Settings:", res2.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}

test();
