const axios = require('axios');
const url = process.env.GAS_WEBAPP_URL || "https://script.google.com/macros/s/AKfycby5t9pQYOPP_U1B-dD0R8kL6L_FXYgC49bYw3x2k59YwF3qj7Y7-W5H5rLw2t2h_1-9/exec";

async function test(token) {
  try {
    const res = await axios.post(url, {
      token: token,
      action: 'ACTION_FIND_USER',
      body: { email: 'amitonlineservice01@gmail.com' }
    });
    console.log("Token", token, "->", res.data);
  } catch (err) {
    console.log("Error", err.message);
  }
}

test('my-super-secret-token');
