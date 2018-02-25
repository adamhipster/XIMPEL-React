import React, { Component } from 'react';
import './App.css';
// import playlist from './playlist.xml';
import playlist from './playlist.xml';
import pubSub from './pubsub.js'
import YouTubePlayer from './YouTube.js';
import io from './socket.io.js';
import JSON from 'circular-json';
import _ from 'lodash';
import Radium from 'radium' //now it is possible to be able to inline CSS pseudo-classes

//ISSUES
//The state --> render can be an issue when you want more control over DOM nodes
//Specifically for lifecycle methods: I do not always know which lifecycle methods are triggered when
// or which if-statements I need to put around it in order to get the exact case that I'd like
// The states of classes need to be reset

//PROS
//Components map really well to tags in the XIMPEL playlist
//There is no jQuery stuff, it is all about data and HTML

// to do: create own children, only when you need them

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
    const partialPropsComponent1 = _.omit(component1[i].props, ['children', 'subjectRendererState']);
    const partialPropsComponent2 = _.omit(component2[i].props, ['children', 'subjectRendererState']);
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
    this.createChildrenOfSubject = this.createChildrenOfSubject.bind(this);
    this.handleMediaCollectionClick = this.handleMediaCollectionClick.bind(this);
    this.getMediaItems = this.getMediaItems.bind(this);
    this.state = {
      currentSubjectNo: 0,
      currentMediaCollection: 0,
      stopCounter: 0,
      mediaItems: [],
      childrenOfSubject: []
    }
    this.state = {
      ...this.state,
      childrenOfSubject: this.createChildrenOfSubject(playlist.ximpel.playlist[0].children[this.state.currentSubjectNo], this.state), 
    }
  }

  createChildrenOfSubject(subject, subjectRendererState){ //assumes parallel play by default
    let children = [];

    for(let j = 0; j < (subject.children?subject.children.length : 0); j++){
      const child = subject.children[j]; //could be a media tag or a media item
      let childName = capitalize(child["#name"]);
      const childAttributes = child.attributes;
      const subjectHasMediaChild = child["#name"] === "media" && subject.children[this.state.currentMediaCollection] === child;
      const isNotMediaChild = child["#name"] !== "media";

      //if subjectHasMediaChild === true, then sequence play ensues for that media collection by excluding the other media collections
      //otherwise nothing is a media collection, thus render everything, 
      //also siblings of media collections that are not media collections should be rendered
      if(subjectHasMediaChild || isNotMediaChild) {
        const grandChildren = child.children? this.createChildrenOfSubject(child, subjectRendererState) : null;
        children.push(React.createElement(eval(childName), {...child.attributes, text: child.text, subjectRendererState: subjectRendererState}, grandChildren));
      }
    }

    return children;
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

    const switchSubject = (topic, subjectNo) => {
      this.setState({
        ...this.state,
        currentSubjectNo: subjectNo,
      }, () => {
        const subjectElement = playlist.ximpel.playlist[0].children[this.state.currentSubjectNo];
        this.setState({
          ...this.state,
          childrenOfSubject: this.createChildrenOfSubject(subjectElement, this.state)
        })
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
            console.log('mediaStop', this.state.stopCounter, children.length);
            if(this.state.stopCounter === children.length){
              this.setState({
                ...this.state,
                currentMediaCollection: (this.state.currentMediaCollection + 1),
                stopCounter: 0
              }, () => {
                const subjectElement = playlist.ximpel.playlist[0].children[this.state.currentSubjectNo];
                this.setState({
                  ...this.state,
                  childrenOfSubject: this.createChildrenOfSubject(subjectElement, this.state)
                })
              });
            }
          })
        } 
      }
    }

    PubSub.subscribe('leadsToUpdate', switchSubject.bind(this));
    PubSub.subscribe('mediaStop', handleMediaStop.bind(this));
  }



  handleMediaCollectionClick(e){
    this.setState({
      ...this.state,
      currentMediaCollection: (this.state.currentMediaCollection + 1)
    }, () => {
      const subjectElement = playlist.ximpel.playlist[0].children[this.state.currentSubjectNo];
      this.setState({
        ...this.state,
        childrenOfSubject: this.createChildrenOfSubject(subjectElement, this.state)
      })
    });
  }

  render(){
    const subjectNo = this.state.currentSubjectNo;
    const subjectElement = playlist.ximpel.playlist[0].children[subjectNo];
    const mediaItems = this.getMediaItems(this.state.childrenOfSubject);

    if(propsCompare(this.state.mediaItems, mediaItems) === false){
      this.setState({
        ...this.state,
        mediaItems: mediaItems
      }, () => {
        console.log('setState mediaItems', this.state.mediaItems);
        const subjectChildren = this.createChildrenOfSubject(subjectElement, this.state);
        this.setState({
          ...this.state,
          childrenOfSubject: subjectChildren
        }, () => {
          console.log('setState mediaItems -- setState childrenOfSubject', this.state.childrenOfSubject);
        })
      });
    }
    

    return (
      <div className="playlist">
        {
          <div className="subjectRenderer">
            { React.createElement(eval("Subject"), {...subjectElement.attributes, text: subjectElement.text}, this.state.childrenOfSubject) }
            <a href="#" style={{position: 'absolute', right: '50px'}} onClick={(e) => this.handleMediaCollectionClick(e)}>next media collection</a>
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
  //keeps time for all specific media types
  //Checks if it needs to render

  constructor(props){
    super(props);
    this.state = {
      duration: parseFloat(props.duration) || 0,
      secondsElapsed: 1,
      hasToRender: true,
      mediaStatus: "MEDIA_IDLE", //MEDIA_STOP & MEDIA_PLAY & MEDIA_IDLE (is not played yet)
      startTime: parseFloat(props.startTime) || 0
    }
    this.hasToRender = this.hasToRender.bind(this);
    this.hasTheRightTime = this.hasTheRightTime.bind(this);

    this.intervalId = setInterval(() => {
      const duration = parseFloat(this.state.duration);
      this.setState({
        ...this.state,
        secondsElapsed: this.state.secondsElapsed + 1,
        hasToRender: this.hasTheRightTime(),
      }, () => { 
        //mediaStatus needs to be set after, because hasToRender has to evaluate to false
        //this will make sure that the 'mediaStop' topic is published
        if(this.state.hasToRender && this.state.mediaStatus === "MEDIA_IDLE"){
          this.setState({
            ...this.state,
            mediaStatus: "MEDIA_PLAY"
          })
        }
      })
    }, 1000);
  }

  componentWillReceiveProps(nextProps){
    //this method is basically more or less the same as the constructor, since it is needed every time
    // a new subject loads (I think...) or new media item loads (I'm sure of that)
    if(propsCompare(this.props, nextProps) === false || this.state.mediaStatus === "MEDIA_STOP"){
      //reset the component, since there is a new media or subject render because the props are not equal 
      // or because the media is stopped in a previous subject

      clearInterval(this.intervalId); //clear the interval of the previous media component
      const mediaItems = this.props.subjectRendererState.mediaItems
      for(let i = 0; i < mediaItems.length; i++){
        if(mediaItems[i].type.toString() === this._reactInternalFiber.type.toString()){
          this.setState({
            ...this.state,
            mediaStatus: "MEDIA_IDLE",
            duration: parseFloat(this.props.duration) || 0,
            secondsElapsed: 0
          }, () => {
            this.intervalId = setInterval(() => {
              const duration = parseFloat(this.state.duration);
              this.setState({
                ...this.state,
                secondsElapsed: this.state.secondsElapsed + 1,
                hasToRender: this.hasTheRightTime()
              }, () => {
                //mediaStatus needs to be set after, because hasToRender has to evaluate to false
                //this will make sure that the 'mediaStop' topic is published
                if(this.state.hasToRender && this.state.mediaStatus === "MEDIA_IDLE"){
                  this.setState({
                    ...this.state,
                    mediaStatus: "MEDIA_PLAY"
                  })
                }
              });
            }, 1000);
          });
        }
      }
    }
  }

  componentDidUpdate(){
    console.log('componentdidupdate mediatype', this.state.hasToRender, this.state.mediaStatus, this._reactInternalFiber.type.toString().slice(1,20))
    if(this.state.hasToRender === false && this.state.mediaStatus === "MEDIA_PLAY"){
      //component is finished playing
      clearInterval(this.intervalId);
      this.setState({
        ...this.state,
        secondsElapsed: 0,
        hasToRender: false,
        mediaStatus: "MEDIA_STOP"
      });
      PubSub.publish('mediaStop', this);
    }
  }

  hasTheRightTime(){
    const hasTheRightTime = this.state.secondsElapsed >= this.state.startTime && (this.state.secondsElapsed <= (this.state.startTime + this.state.duration) || this.state.duration === 0);
    return hasTheRightTime;
  }

  hasToRender(){
    return this.state.hasToRender;
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
    
    //next leadsto
    let hasLeadsTo = false;
    for (let i = 0; i < playlist.ximpel.playlist[0].children.length; i++) {
      if(playlist.ximpel.playlist[0].children[i].attributes.id === this.props.leadsTo){
        PubSub.publish('leadsToUpdate', i);
        hasLeadsTo = true;
        break;
      }
    }

    //if no leadsto then next media item
    if(hasLeadsTo === false){
      // PubSub.publish('mediaStop', this);
      this.setState({
        hasToRender: false
      })
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

class Youtube extends MediaType {
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

class P extends MediaType {
  constructor(props){
    super(props);
  }

  render(){
    console.log(this);
    return(
      this.hasToRender() && <p> {this.props.children} {this.props.text}  </p>
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
    console.log('playlist');
    console.log(this.playlist);
  }

  render() {
    return (
      <div>hot reload is possible!! {<SubjectRenderer subject={undefined} />}</div>
    );
  }
}

export default App;