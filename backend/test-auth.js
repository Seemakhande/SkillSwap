const { loginUser } = require('./controllers/authController');

const req = {
  body: {
    email: 'seemakhande68@gmail.com',
    password: 'password' // We don't care if it fails auth, we just want to see if it throws "Server database fault"
  }
};

const res = {
  status: function(s) { this.s = s; return this; },
  json: function(j) { console.log('Status:', this.s, 'Response:', j); },
  cookie: function() {}
};

async function test() {
  process.env.JWT_SECRET = 'skillswap_super_secret_key_2026'; // ensure secret
  await loginUser(req, res);
  process.exit();
}

test();
