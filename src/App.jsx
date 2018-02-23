import React, { Component } from 'react';
import './App.css';
// import playlist from './playlist.xml';
import playlist from './playlist_zaanse_schans.xml';
import pubSub from './pubsub.js'
import YouTubePlayer from './YouTube.js';
import io from './socket.io.js';
import JSON from 'circular-json';
import _ from 'lodash';
import Radium from 'radium' //now it is possible to do inline CSS pseudo-classes

function capitalize(element){
  return element.toString().charAt(0).toUpperCase() + element.toString().slice(1);
}

function difference(object, base) {
	function changes(object, base) {
		return _.transform(object, function(result, value, key) {
			if (!_.isEqual(value, base[key])) {
				result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
}

function propsCompare(component1, component2){
  if(component1.length !== component2.length){
    return false;
  }
  for(let i = 0; i < component1.length; i++){
    const partialPropsComponent1 = _.omit(component1[i].props, 'children');
    const partialPropsComponent2 = _.omit(component2[i].props, 'children');
    if(Object.compare(partialPropsComponent1, partialPropsComponent2) === false){
      return false;
    }
  }
  return true;
}

Object.compare = (object, base) => {
  return _.isEqual(difference(object, base), {})
}

class SubjectRenderer extends Component {
  constructor(props) {
    super(props);
    console.log('playlist');
    console.log(playlist);
    this.state = {
      currentSubjectNo: 0,
      currentMediaItem: 0,
      children: [],
      stopCounter: 0,
      mediaItems: [],
    }
    this.createChildren = this.createChildren.bind(this);
    this.selectSubtree = this.selectSubtree.bind(this);
    this.handleMediaItemClick = this.handleMediaItemClick.bind(this);
    this.determineMediaItems = this.determineMediaItems.bind(this);
    this.getMediaItems = this.getMediaItems.bind(this);
  }

  createChildren(element){ //assumes parallel play by default
    let children = [];
    let hasMedia = false;
    //see if media tags are at the top
    for(let j = 0; j < (element.children?element.children.length : 0); j++){
      const child = element.children[j];
      let renderNormalHTML = false;
      switch(child["#name"]){
        case "p":
        case "h1":
        case "img":
        renderNormalHTML = true;
      }
      if(renderNormalHTML === false){
        let childName = capitalize(child["#name"]);
        childName = childName === "Youtube"? "YouTube" : childName;
        const childAttributes = child.attributes;
        const grandChildren = child.children? this.createChildren(child) : null;
        children.push(React.createElement(eval(childName), {...child.attributes, text: child.text}, grandChildren));
      }
      else {
        const childAttributes = child.attributes;
        const grandChildren = child.children? this.createChildren(child) : null;
        children.push(React.createElement(child["#name"], {...child.attributes}, child.text, grandChildren));
      }
    }
    return children;
  }

  selectSubtree(children){
    const selectedElements = [];
    const currentMediaItem = children[this.state.currentMediaItem];
    selectedElements.push(currentMediaItem);
    //also include randoms
    for(let i = 0; i < children.length; i++){
      if(children[i].type.toString() !== Media.toString()){
        selectedElements.push(children[i]);
      }
    }
    return selectedElements;
  }

  determineMediaItems(element){
    let hasMediaItems = false;
    for(let j = 0; j < (element.children?element.children.length : 0); j++){
      const child = element.children[j];
      if(child["#name"] === "media" && element.children[this.state.currentMediaItem] === child){
        hasMediaItems = true;
      }
    }
    return hasMediaItems;
  }

  getMediaItems(children){
    const mediaItems = [];
    for(let i = 0; i < children.length; i++){
      if(children[i].type.toString() !== Media.toString()){
        mediaItems.push(children[i]);
      }
      else{
        for(let j = 0; j < children[i].props.children.length; j++){
          mediaItems.push(children[i].props.children[j]);
        }
      }
    }
    return mediaItems;
  }

  //all pub-subs are here
  componentWillMount(){
    const handleOverlay = (topic, subjectNo) => {
      this.setState({
        ...this.state,
        currentSubjectNo: subjectNo
      });
    };

    const handleMediaStop = (topic, mediaElement) => {
      const children = this.state.mediaItems;

      for (let i = 0; i < children.length; i++) {
        const element = children[i];
        if(element.type.toString() === mediaElement._reactInternalFiber.type.toString()){
          this.setState({
            ...this.state,
            stopCounter: this.state.stopCounter + 1
          }, () => {
            //to do: needs to improve to actual media items
            if(this.state.stopCounter === children.length){
              this.setState({
                ...this.sate,
                currentMediaItem: (this.state.currentMediaItem + 1),
                stopCounter: 0
              });
            }
          })
        } 
      }
    }

    PubSub.subscribe('leadsToUpdate', handleOverlay.bind(this));
    PubSub.subscribe('mediaStop', handleMediaStop.bind(this));
  }

  

  handleMediaItemClick(e){
    this.setState({
      ...this.state,
      currentMediaItem: (this.state.currentMediaItem + 1)
    });
  }

  render(){
    const subjectNo = this.state.currentSubjectNo;
    const element = playlist.ximpel.playlist[0].children[subjectNo];
    const elementName = "Subject";
    let children = this.createChildren(element); //play everything in the subject
    let hasMediaItems = this.determineMediaItems(element);
    let mediaItems = [];
    if(hasMediaItems){
      children = this.selectSubtree(children);
      mediaItems = this.getMediaItems(children);
      // console.log('mediaItems render');
      // console.log(this.state.currentMediaItem);
      // console.log('propsCompare');
      // console.log(this.state.mediaItems, mediaItems);
      // console.log( propsCompare(this.state.mediaItems, mediaItems) === false);

      //ik denk dat het hier fout gaat want deze vergelijking gaat volgens mij fout
      if(propsCompare(this.state.mediaItems, mediaItems) === false){
        this.setState({
          ...this.state,
          mediaItems: mediaItems
        });
        PubSub.publish('new media items', this.state.mediaItems);
      }
    }

    //an actual comparison goes wrong, while I know this is bad practice knowing which mediaItems you
    //need to play is really handy.
    if(JSON.stringify(Object.keys(this.state.children)) !== JSON.stringify(Object.keys(children))){
      this.setState({
        ...this.state,
        children: children
      });
    }

    return (
      <div className="playlist">
        {
          <div className="subjectRenderer">
            { React.createElement(eval(elementName), {...element.attributes, text: element.text}, children) }
            <a href="#" style={{position: 'absolute', right: '50px'}} onClick={(e) => this.handleMediaItemClick(e)}>>></a>
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
      duration: props.duration || 0,
      secondsElapsed: 0,
      hasToRender: true,
      playStatus: "MEDIA_PLAY"
    }
    this.hasToRender = this.hasToRender.bind(this);
    const newMediaItem = (topic, mediaItems) => {
      for(let i = 0; i < mediaItems.length; i++){
        if(mediaItems[i].type.toString() === this._reactInternalFiber.type.toString()){
          this.intervalId = setInterval(() => {
            this.setState({
              ...this.state,
              secondsElapsed: this.state.secondsElapsed + 1,
              hasToRender: (parseInt(this.state.secondsElapsed) <= this.state.duration || this.state.duration === 0)
            });
          }, 1000);
          this.setState({
            ...this.state,
            playStatus: "MEDIA_PLAY",
            duration: this.props.duration || 0,
            // intervalId: intervalId
          });
        }
      }
    };
    PubSub.subscribe('new media items', newMediaItem.bind(this)); //communicates with SubjectRenderer
  }

  componentWillMount(){
    clearInterval(this.interval);
    this.setState({
      duration: 1,
      secondsElapsed: 0,
      hasToRender: true,
      playStatus: "MEDIA_PLAY",
      // intervalId: 0
    });
  }

  componentDidMount() {
    this.intervalId = setInterval(() => {
      this.setState({
        ...this.state,
        secondsElapsed: this.state.secondsElapsed + 1,
        hasToRender: (parseInt(this.state.secondsElapsed) <= this.state.duration || this.state.duration === 0)
      })
    }, 1000);
    this.setState({
      ...this.state,
      duration: this.props.duration || 0,
      // intervalId: intervalId
    });
  }

  componentDidUpdate(){
    if(this.state.secondsElapsed >= parseInt(this.state.duration || this.state.duration === 0) && this.state.playStatus === "MEDIA_PLAY"){
      clearInterval(this.intervalId);
      this.setState({
        ...this.state,
        secondsElapsed: 0,
        hasToRender: false
      })
      // this.intervalId = setInterval(() => {
      //   this.setState({
      //     ...this.state,
      //     secondsElapsed: this.state.secondsElapsed + 1,
      //     hasToRender: (parseInt(this.state.secondsElapsed) <= this.state.duration || this.state.duration === 0)
      //   })
      // }, 1000);
    }
  }

  hasToRender(){
    if(this.state.hasToRender === false && this.state.playStatus !== "MEDIA_STOP"){
      PubSub.publish('mediaStop', this);
      this.setState({
        ...this.state,
        playStatus: "MEDIA_STOP"
      })
    }
    return this.state.hasToRender;
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    this.setState({
      ...this.state,
      secondsElapsed: 0,
      hasToRender: false
    })
  }

  render(){
    return null;
  }
}

class Video extends MediaType {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      key: 0
    }
    this.handleEnd = this.handleEnd.bind(this);
    const changeKey = (topic, src) => {
      this.setState({
        key: this.state.key + 1
      });
    }
  
    pubSub.subscribe('change key for video', changeKey.bind(this));
  }

  handleEnd(event){
    if(this.props.repeat === "true"){
      pubSub.publish('video repeat');
      this.video.load();
      this.video.play();
      return;
    }
    for (let i = 0; i < playlist.ximpel.playlist[0].children.length; i++) {
      if(playlist.ximpel.playlist[0].children[i].attributes.id === this.props.leadsTo){
        PubSub.publish('leadsToUpdate', i);
        break;
      }
    }
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
    };

    return(
       this.hasToRender() && <div>
        <video ref={node => this.video = node} key={this.state.key} preload="none" autoPlay style={styles} onEnded={e => this.handleEnd(e) }>
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

  shouldComponentUpdate(nextProps, nextState){
    if(this.props.file !== nextProps.file){
      // const videoPathName = nextProps.file + '.' + nextProps.extensions;
      pubSub.publish('change key for video');
    }
    return true;
  }

  render(){
    const {file, extensions, types} = this.props;

    return(
      this.hasToRender() && <source src={file+'.'+extensions} type={types} />
    );
  }
}


class Message extends MediaType {
  constructor(props) {
    super(props);
  }

  render() {
    const {message, showScore} = this.props;

    return (
      this.hasToRender() && <p>
        {message} 
        {(showScore !== undefined)? " your score is: " + JSON.stringify(Overlay.score) : null}
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
      this.hasToRender() && <p style={styles}>{message}</p>
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
      this.hasToRender() && <img src={src} style= {{position: 'absolute', width: width+'px', height: height+'px', left: left+'px', top: top+'px'}} />
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
      this.hasToRender() && <YouTubePlayer
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
      this.hasToRender() && 
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
      this.hasToRender() && <div className="way!">
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
      this.hasToRender() && <p>boilerplate --- dynamic: {message}</p>
    );
  }
}


class Overlay extends Component {
  static score = {};

  constructor(props) {
    super(props);

    this.state = ({
      secondsElapsed: 0,
      startTime: parseFloat(this.props.startTime) || 0,
      duration: parseFloat(this.props.duration) || 0
    });

    const resetState = (topic, data) => {
      this.setState({
        ...this.state,
        secondsElapsed: 0,
        startTime: parseFloat(this.props.startTime) || 0,
        duration: parseFloat(this.props.duration) || 0
      })
    };

    pubSub.subscribe('leadsToUpdate', resetState.bind(this)); //allows for easy timer reset
    pubSub.subscribe('video repeat', resetState.bind(this));

    this.handleClick = this.handleClick.bind(this);
    this.handleScore = this.handleScore.bind(this);
  }

  componentDidMount(){
    this.intervalId = setInterval(() => {
      this.setState({
        ...this.state,
        secondsElapsed: this.state.secondsElapsed + 1,
      });
    }, 1000);
  }

  componentWillUnmount(){
    clearInterval(this.intervalId);
  }

  handleClick(leadsTo, event){
    if(this.props.score !== undefined){
      this.handleScore();
    }
    for (let i = 0; i < playlist.ximpel.playlist[0].children.length; i++) {
      if(playlist.ximpel.playlist[0].children[i].attributes.id === leadsTo){
        console.log(this.props.leadsTo);
        PubSub.publish('leadsToUpdate', i);
        break;
      }
    }
  }

  handleScore(){
    if(this.props.score[0] === "*"){
      Overlay.score[this.props.scoreId] = (Overlay.score[this.props.scoreId]? Overlay.score[this.props.scoreId] : 0) * parseInt(this.props.score.slice(1));
    }
    else if(this.props.score[0] === "/"){
      Overlay.score[this.props.scoreId] = (Overlay.score[this.props.scoreId]? Overlay.score[this.props.scoreId] : 0) / parseInt(this.props.score.slice(1));
    }
    else if(this.props.score[0] === "+" || this.props.score[0] === "-"){
      Overlay.score[this.props.scoreId] = (Overlay.score[this.props.scoreId]? Overlay.score[this.props.scoreId] : 0) + parseInt(this.props.score);
    }
    else{
      console.log('invalid score your score is: ', this.props.score);
    }
  }

  render() { 
    console.log(this.state);
    const {message, leadsTo, src, width, height, x, y} = this.props;
    let left = (parseInt(x) / 1.55) + "px";
    let top = (parseInt(y) / 1.50) + "px";
    const hasTheRightTime = this.state.secondsElapsed >= this.state.startTime && (this.state.secondsElapsed <= (this.state.startTime + this.state.duration) || this.state.duration === 0);

    const divStyle = {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      ':hover': {
        backgroundColor: '#ffffff'
      },
      ':focus': {
        backgroundColor: '#fff'
      },
      width: width,
      height: height,
      zIndex: 1,
      left: left,
      top: top
    };
    const textStyles = {
      display: 'block',
      position: 'absolute'
    };
    const imgStyles = {
      width: width,
      height: height,
    };

    return (
        hasTheRightTime && <div className="overlay" style={divStyle} onClick={(event) => this.handleClick(leadsTo, event)}>
          <a href="#" style={textStyles}><img style={imgStyles} src={src} /> <br/> {message}</a> 
        </div>
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