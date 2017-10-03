import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// import registerServiceWorker from './registerServiceWorker';
import playlist from './playlist.xml';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// enable this when you're programming a progressive web app
// see https://github.com/facebookincubator/create-react-app/issues/2398
// registerServiceWorker();