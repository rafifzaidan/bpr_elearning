const https = require('https');

const url = 'https://tqskhwdcofsxomtjpctw.supabase.co/storage/v1/object/public/modules/1775534297130_LOI_VisualCam.ID.pdf';

https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  if (res.statusCode >= 300) {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log('Body:', data));
  } else {
      console.log('Success response received.');
  }
}).on('error', (e) => {
  console.error(e);
});
