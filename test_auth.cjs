const axios = require('axios');
const url = "http://localhost:3000/api/auth/signup";

async function test() {
  try {
    const signup = await axios.post(url, {
      name: "Test User 2",
      email: "test2@example.com",
      mobile: "1234567890",
      password: "password123",
      authType: "password"
    });
    console.log("Signup:", signup.data);

    const loginUrl = "http://localhost:3000/api/auth/login";
    const login = await axios.post(loginUrl, {
      email: "test2@example.com",
      password: "password123",
      authType: "password"
    });
    console.log("Login:", login.data);
  } catch (err) {
    if (err.response) {
      console.log("Error response:", err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}

test();
