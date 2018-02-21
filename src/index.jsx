// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';
// // import registerServiceWorker from './registerServiceWorker';

// ReactDOM.render(
//   <App />,
//   document.getElementById('app')
// );

// if(module.hot) {

// }

// // enable this when you're programming a progressive web app
// // see https://github.com/facebookincubator/create-react-app/issues/2398
// // registerServiceWorker();

import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import App from '../common/App'
render(<AppContainer>
 <App />
</AppContainer>, document.getElementById('root'))
if (module.hot) {
    module.hot.accept('../common/App', () => {
        render(<AppContainer>
          <App />
        </AppContainer>, document.getElementById('root'))
    })
}