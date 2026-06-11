const os = require('os');
const originalUserInfo = os.userInfo;
os.userInfo = function(options) {
  const info = originalUserInfo.call(this, options);
  info.username = 'user'; // ONLY patch the username to avoid non-ASCII HTTP header errors
  return info;
};
const originalHostname = os.hostname;
os.hostname = function() {
  return 'localhost';
};
