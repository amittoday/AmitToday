const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const formData = {
    BUSINESS_NAME: "AMIT ONLINE",
    BUSINESS_LOGO: "data:image/png;base64," + "A".repeat(55000), 
    BUSINESS_ADDRESS: "test address",
    BUSINESS_MAP_LINK: "",
    BUSINESS_HOURS: "",
    BUSINESS_GSTIN: "",
    LINK_FACEBOOK: "",
    LINK_INSTAGRAM: "",
    LINK_TWITTER: "",
    LINK_YOUTUBE: "",
    LINK_WHATSAPP: ""
  };
  
  try {
    const response = await axios.post(process.env.GAS_WEBAPP_URL, {
      token: process.env.GAS_SECRET_TOKEN,
      action: 'ACTION_SAVE_SETTINGS',
      body: formData
    });
    console.log(response.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}

test();
