import React, { Component } from 'react';
import Autolinker from 'autolinker';
import './App.css';
import playlist from './playlist.xml';

class Playlist extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    const data = this.props.data.ximpel;

    console.log('data');
    console.log(data);
    return (
      <div className="yolo">
        {
          Object.keys(data).map( element => {
            const elementName = element.toString().charAt(0).toUpperCase() + element.toString().slice(1);;
            return data[element].map( (element, i) => {
              console.log('elementName');
              console.log(elementName.toString());
              console.log(element);
              {/* console.log(React); */}
              return (
                <div key={i}>
            
                  {/* component, props, children */}
                  {React.createElement(eval(elementName), element.$, Object.keys(element))}
            
                </div>
              );
            })
            
          })
        }

  
      </div>
    );
  }
}

class Yolo extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <div className="way!">
        {this.props.children}
        way!
      </div>
    );
  }
}

class Hey extends Component {
  constructor(props) {
    super(props);
  }

  render() { 
    const {text} = this.props;

    return (
      <p>{text}</p>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.playlist = playlist;
    console.log(this.playlist);
  }

  render() {
    return (
      <div>{<Playlist data={this.playlist} />}</div>
    );
  }
}

export default App;