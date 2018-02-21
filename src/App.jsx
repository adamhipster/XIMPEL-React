import React, { Component } from 'react';
import './App.css';
import playlist from './playlist.xml';
import pubSub from './pubsub.js'
import YouTubePlayer from './YouTube.js';

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

class SubjectRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSubjectNo: 1,
      dummy: "dummy"
    }
  }

  componentWillMount(){
    var handleOverlay = function (topic, subjectNo) {
      this.setState({
        currentSubjectNo: subjectNo
      });
      console.log( topic, subjectNo );
    };
    var token = PubSub.subscribe('overlayUpdate', handleOverlay.bind(this));
  }

  render(){
    console.log('render');
    const subjectNo = this.state.currentSubjectNo;
    const element = playlist.ximpel.subject[subjectNo];
    console.log(playlist);
    const elementName = "Subject";
    const children = createChildren(element);

    return (
      <div className="playlist">
        {
          <div>
            { React.createElement(eval(elementName), {...element.attributes, text: element.text}, children) }
          </div>
        }
      </div>
    );
  }
}

class Media extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    
    return(
      <div className="media">
        {this.props.children}
      </div>
    );
  }
}

class Subject extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    const {id} = this.props;

    return(
      <div className="subject" id={id}>
        {this.props.children}
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
    const {message} = this.props;

    return (
      <p>boilerplate --- dynamic: {message}</p>
    );
  }
}

class Image extends Component {
  constructor(props) {
    super(props);
  }

  render() { 
    const {src, width, height, left, top} = this.props;

    return (
      <img src={src} style= {{position: 'absolute', width: width+'px', height: height+'px', left: left+'px', top: top+'px'}} />
    );
  }
}

class YouTube extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    const {width, height, left, top, id} = this.props;
    const opts = {
      height: height,
      width: width,
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 1
      }
    };

    return (
      <YouTubePlayer
        style={{display: 'block', position: 'absolute', left: left+'px', top: top+'px'}}
        videoId={id}
        opts={opts}
        onReady={this._onReady}
      />
    );
  }

  _onReady(event) {
    // access to player in all event handlers via event.target
    // event.target.pauseVideo();
  }
}

class Overlay extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(leadsTo, event){
    for (let i = 0; i < playlist.ximpel.subject.length; i++) {
      if(playlist.ximpel.subject[i].attributes.id === leadsTo){
        console.log(playlist.ximpel.subject[i].attributes.id, leadsTo, i, event);
        PubSub.publish('overlayUpdate', i);
        break;
      }
    }
  }

  render() { 
    const {message, leadsTo, src, width, height, left, top} = this.props;
    const textStyles = {
      display: 'block',
      position: 'absolute',
      left: left+'px',
      top: top+'px'
    }
    const imgStyles = {
      width: width+'px',
      height: height+'px',
    }

    return (
      src?
        <a href="#" style={textStyles} onClick={(event) => this.handleClick(leadsTo, event)}><img style={imgStyles} src={src} /> <br/> {message}</a> 
          :
        <a href="#" style={textStyles} onClick={(event) => this.handleClick(leadsTo, event)}>{message}</a>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    console.log(this.playlist);
  }

  render() {
    return (
      <div>hot reload is possible!! {<SubjectRenderer subject={undefined} />}</div>
    );
  }
}

export default App;