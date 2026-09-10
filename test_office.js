const axios = require('axios');
const url = "http://localhost:3000/api/office-hours";

axios.get(url).then(res => {
  console.log("Response:", res.data);
}).catch(console.error);
