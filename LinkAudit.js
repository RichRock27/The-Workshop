function checkLinks() {
  const links = [
    'https://script.google.com/macros/s/AKfycbxEi4sb9uf5yEVAUjDcFJA4yh9NREhIR1psk-Hm6mzbHBUxweMmuT2SsrEir6-p9P_2/exec',
    'https://script.google.com/macros/s/AKfycbwE_d_IkcoVTv7EZGJD5PttesrtBahn361sMPcDA8Q0XtbWobTVs3BqF1NCIMHowdIM/exec',
    'https://script.google.com/macros/s/AKfycbzeYt_Kn-aoIbU0Dtcqnr5BM0L2HsdVeRQt33aDVXgBNyw1Ep33M1swnrSo3HhectXv/exec',
    'https://script.google.com/macros/s/AKfycbyzLRh_NTcGJwQsY4If9raiL6j5tSY5Z4KZ_fP4JwU31i0wqp5qy8cR3-9JT7SidmZcQw/exec',
    'https://script.google.com/macros/s/AKfycbwuS1MhQD1NyDrLouPjBNf6rQAhISI4tGF3aml3QWgBO_TqYypTTpOcNBF4zC-uq7Lu/exec',
    'https://script.google.com/macros/s/AKfycbxIM8Oie8S0TXajR--FMpPNLLlSZdOXZOiahdcmJTxKo6eFaJVAt46nsrNifOeTEMKF/exec',
    'https://script.google.com/macros/s/AKfycbwD1tT3vfmPgMkA_Xni6iykjQMo_7w1pp-w-HlRk10eRfKLxLlZ7kUQMnxIJVl9CGu2zg/exec',
    'https://script.google.com/macros/s/AKfycbySbt4QYp503Z0g9faCL1InM1VPma8yz4k7FAPN1s1LIaFbk3uTs7A3MLx_cBHwMMeN6A/exec',
    'https://script.google.com/macros/s/AKfycbzEyLtO2ZmJ9-5bO-RM6n4mW_JnQXf0PU4A2rg4OdJu08ngfSY4v5HqL2pZ7zU2Vwog1g/exec', // Intentionally checking the OLD one to see failure
    'https://script.google.com/macros/s/AKfycby8EXzDACY3PhHMzAqtybnFJhFW10UCTzMNHNhMtAema2W8TcO10HqtNWhZdw-zAHUqpw/exec',
    'https://script.google.com/macros/s/AKfycbwQootHBXSvH0aGsYQO4RVAHieuB5fB5tjCFgs75GJfEYpONgLR6eQ4Bijfet-YcIY4/exec',
    'https://script.google.com/macros/s/AKfycbxJtblVAvf97Ci8-Wj8WKojXSLTgG2use3t42uEJ1I3-aEqjJ2JXxrRZnm9LKjcui0S/exec'
  ];
  
  links.forEach(url => {
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const code = response.getResponseCode();
      const content = response.getContentText();
      let status = "OK";
      
      if (code !== 200) status = "HTTP " + code;
      if (content.includes("Sign in")) status = "LOCKED (Login Required)";
      if (content.includes("script function not found")) status = "BROKEN Script";
      
      console.log(`[${status}] ${url.split('/s/')[1].split('/')[0].substring(0,10)}...`);
    } catch(e) {
      console.log(`[FAILED] ${url} : ${e.message}`);
    }
  });
}
