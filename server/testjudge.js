const axios = require('axios');

axios.post('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
  source_code: 'print("hello")',
  language_id: 71,
  stdin: ''
}).then(r => console.log('SUCCESS:', r.data.stdout))
  .catch(e => console.log('ERROR:', e.message))