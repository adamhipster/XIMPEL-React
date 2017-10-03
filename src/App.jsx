import React, { Component } from 'react';
import Autolinker from 'autolinker';
import './App.css';
import playlist from './playlist.txt';

class Message extends Component {
  constructor(props) {
    super(props);
  }

  render() { 
    const {text} = this.props;

    return (
      <p>hey</p>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.playlist = playlist;
  }

  render() {
    return (
      <div>{this.playlist}</div>
    );
  }
}

export default App;