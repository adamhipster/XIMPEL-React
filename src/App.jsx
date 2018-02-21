import React, { Component } from 'react';
import './App.css';
import playlist from './playlist.xml';
import pubSub from './pubsub.js'
import YouTubePlayer from './YouTube.js';
import io from './socket.io.js';

function capitalize(element){
  return element.toString().charAt(0).toUpperCase() + element.toString().slice(1);
}

function createChildren(element){
  let children = [];
  for(let j = 0; j < (element.children?element.children.length : 0); j++){
    const child = element.children? element.children[j] : null;
    let childName = element.children? capitalize(child["#name"]) : null;
    childName = childName === "Youtube"? "YouTube" : childName;
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
      currentSubjectNo: 0,
      dummy: "dummy"
    }
  }

  componentWillMount(){
    var handleOverlay = function (topic, subjectNo) {
      this.setState({
        currentSubjectNo: subjectNo
      });
    };
    var token = PubSub.subscribe('overlayUpdate', handleOverlay.bind(this));
  }

  render(){
    const subjectNo = this.state.currentSubjectNo;
    const element = playlist.ximpel.playlist[0].children[subjectNo];
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

class MediaType extends Component {
  constructor(props){
    super(props);
    this.state = {
      duration: 0,
      secondsElapsed: 0,
      hasToRender: true
    }
  }

  componentDidMount() {
    this.setState({
      ...this.state,
      duration: this.props.duration || 0
    });
    this.interval = setInterval(() => {
      this.setState({
        ...this.state,
        secondsElapsed: this.state.secondsElapsed + 1,
        hasToRender: (this.state.secondsElapsed <= this.state.duration || this.state.duration === 0)
      })
    }, 1000);
    
  }


  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(){
    return null;
  }
}

class Video extends MediaType {
  constructor(props) {
    super(props);
  }

  render(){
    const {x, y, width, height} = this.props;
    const styles = {
      display: 'block',
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
    }
    return(
       this.state.hasToRender && <div>
        <video preload="none" autoPlay style={styles} >
          {
            this.props.children.map( element => 
              element.type.toString() === Overlay.toString()? null : element)
          }
        </video>
          {
            this.props.children.map( element => 
              element.type.toString() === Overlay.toString()? element : null)
          }
      </div>
    );
  }
}

class Source extends MediaType {
  constructor(props) {
    super(props);
  }

  render(){
    const {file, extensions, types} = this.props;


    return(
      this.state.hasToRender && <source src={file+'.'+extensions} type={types} />
    );
  }
}


class Message extends MediaType {
  constructor(props) {
    super(props);
  }

  render() {
    const {message} = this.props;

    return (
      this.state.hasToRender && <p>
        {message}
        {this.props.children}
      </p>
    );
  }
}

class Textblock extends MediaType {
  constructor(props) {
    super(props);
  }

  render() {
    const {message, width, height, x, y, color, fontsize, fontcolor} = this.props;
    const styles = {
      position: 'absolute',
      width: width,
      height: height,
      left: x,
      top: y,
      color: fontcolor,
      fontSize: fontsize,
      backgroundColor: color
    }

    return (
      this.state.hasToRender && <p style={styles}>{message}</p>
    );
  }
}

class Image extends MediaType {
  constructor(props) {
    super(props);
  }

  render() { 
    const {src, width, height, left, top} = this.props;

    return (
      this.state.hasToRender && <img src={src} style= {{position: 'absolute', width: width+'px', height: height+'px', left: left+'px', top: top+'px'}} />
    );
  }
}

class YouTube extends MediaType {
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
      this.state.hasToRender && <YouTubePlayer
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

class Terminal extends MediaType {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state, 
      inputValue: "",
      outputValue: "",
      terminalHistory: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateInputValue = this.updateInputValue.bind(this);
    this.socket = new io.connect('http://localhost:8888');
    this.socket.on('connect',function() {
      console.log('Client has connected to the server!');
    });
    
    this.socket.on('exit', (data) => {
      this.setState({
        ...this.state,
        terminalHistory: '<p class="terminalOutput">' + data + '</p>' + this.state.terminalHistory
      });
    })
    
    this.socket.on('message', (data) => {
      var buf = String.fromCharCode.apply(null, new Uint8Array(data));
      this.setState({
        ...this.state,
        terminalHistory: '<p class="terminalCommand">' + buf + '</p>' + this.state.terminalHistory
      });
    });

    this.socket.on('cmd_message', (data) => {
      var buf = String.fromCharCode.apply(null, new Uint8Array(data));
      this.setState({
        ...this.state,
        terminalHistory: '<p class="terminalOutput">' + buf + '</p>' + this.state.terminalHistory
      });
    });
  }

  handleSubmit(event){
    event.preventDefault();
    this.socket.send(this.state.inputValue);
  }

  updateInputValue(event){
    this.setState({
      inputValue: event.target.value
    })
  }

  render() {
    const {x, y} = this.props;
    const styles = {
      position: 'absolute',
      left: x,
      top: y
    }
    return(
      this.state.hasToRender && 
        <div style={styles} className="terminalWrapper">
          <form className="terminalForm" onSubmit={(event) => this.handleSubmit(event)}>
            <input className="terminalInput" value={this.state.inputValue} onChange={event => this.updateInputValue(event)} />
          </form>
        <div className="terminalDiv">
          <div dangerouslySetInnerHTML={{__html: this.state.terminalHistory}} />
        </div>
      </div>
    );
  }
}

class Yolo extends MediaType {
  constructor(props) {
    super(props);
  }

  render(){
    const {sup, text} = this.props;

    return(
      this.state.hasToRender && <div className="way!">
        {sup} <br />
        {text}
        {this.props.children}
      </div>
    );
  }
}

class Hey extends MediaType {
  constructor(props) {
    super(props);
  }

  render() { 
    const {message} = this.props;

    return (
      this.state.hasToRender && <p>boilerplate --- dynamic: {message}</p>
    );
  }
}


class Overlay extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(leadsTo, event){
    for (let i = 0; i < playlist.ximpel.playlist[0].children.length; i++) {
      if(playlist.ximpel.playlist[0].children[i].attributes.id === leadsTo){
        PubSub.publish('overlayUpdate', i);
        break;
      }
    }
  }

  render() { 
    const {message, leadsTo, src, width, height, x, y} = this.props;
    const textStyles = {
      display: 'block',
      position: 'absolute',
      left: x,
      top: y
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