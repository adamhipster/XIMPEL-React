import React, { Component } from 'react';
import './App.css';
import playlist from './playlist.xml';

function capitalize(element){
  return element.toString().charAt(0).toUpperCase() + element.toString().slice(1);
}

function createChildren(element){
  let children = [];
  for(let j = 0; j < (element.children?element.children.length : 0); j++){
    const child = element.children? element.children[j] : null;
    const childName = element.children? capitalize(child["#name"]) : null;
    const childAttributes = element.children? child.attributes : null;
    const grandChildren = child.children? createChildren(child) : null;
    children.push(React.createElement(eval(childName), {...child.attributes, text: child.text}, grandChildren));
  }
  return children;
}

class Playlist extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    const data = this.props.data.ximpel;

    return (
      <div className="yolo">
        {
          data.children.map( (element, i) => {
            const elementName = capitalize(element["#name"]);
            const children = createChildren(element);
            console.log('kids ', children);
            return (
              <div key={i}>
                { React.createElement(eval(elementName), {...element.attributes, text: element.text}, children) }
              </div>
            );
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
    const {sup, text} = this.props;
    console.log('props');
    console.log(this.props);

    return(
      <div className="way!">
        {sup} <br />
        {text}
        {this.props.children}
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
      <div>hot reload is possible!! {<Playlist data={this.playlist} />}</div>
    );
  }
}

export default App;