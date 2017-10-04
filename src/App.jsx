import React, { Component } from 'react';
import './App.css';
import playlist from './playlist.xml';

function capitalize(element){
  return element.toString().charAt(0).toUpperCase() + element.toString().slice(1);
}

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
            const elementName = capitalize(element);
            return data[element].map( (element, i) => {
              console.log('elementName');
              console.log(elementName.toString());
              console.log(element);
              let child = Object.keys(element).filter( value =>  value !== "$" );
              child = child.length > 0? child[0] : child;
              console.log(child);
              const childName = capitalize(child);
              console.log(element[child])
              child = element[child] !== undefined? element[child][0] : child;
              
              {/* console.log(React); */}
              return (
                <div key={i}>
            
                  {/* component, props, children */}
                  {
                    React.createElement(eval(elementName), element.$, 
                      React.createElement(eval(childName), child.$, null))
                    }
            
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
      <p>boilerplate --- dynamic: {text}</p>
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