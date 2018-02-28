import React, { Component } from 'react';
import './App.css';
// import playlist from './playlist.xml';
import playlist from './playlist_zaanse_schans.xml';
import pubSub from './pubsub.js'
import YouTubePlayer from './YouTube.js';
import io from './socket.io.js';
import JSON from 'circular-json';
import _ from 'lodash';
import Radium from 'radium' //now it is possible to be able to inline CSS pseudo-classes

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

// function createChildren(parent, parentState){ //assumes parallel play by default
//   let children = [];
//   for(let j = 0; j < (parent.children?parent.children.length : 0); j++){
//     const child = parent.children[j]; //could be a media tag or a media item
//     let childName = capitalize(child["#name"]);
//     const childAttributes = child.attributes;
//     children.push(React.createElement(eval(childName), {...child.attributes, text: child.text, parentState: parentState}, null));
//   }

//   return children;
// }

//picks a subject and renders it
// class Node extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       depth: 0,
//       currentChildNo: 0,
//       playlist: playlist
//     };
//     this.state.childElement = getChildElement(playlist.ximpel.playlist[0], this.state.depth, this.state.parentState);
//     this.getChildElement = this.getChildElement.bind(this);
//   }

//   getChildElement(playlist, depth, parentState){
//     function traverse(playlist, depth, parentState){

//       return 
//     }
//     traverse(playlist, depth, parentState);
//   }
// }

class Ximpel extends Component {
  constructor(props){
    super(props);
    console.log(props.playlist);
  }
  render(){
    const playlist = this.props.playlist;
    const element = playlist.children[0];

    return (
      <div className="ximpel-root">
        { 
          element["#name"] === "playlist"?
            <Playlist {...element.attributes} text={element.text} playlist={element} />
            :
            <p>You did not write the playlist tag</p>
        }
      </div>
    );
  }
}

class Playlist extends Component {
  constructor(props){
    super(props);
    console.log(props.playlist);
    this.state = {
      currentChildNo: 0,
    }
  }

  // all pub-subs are here
  componentWillMount(){
  
    const switchSubject = (topic, subjectNo) => {
      console.log('switchSubject', subjectNo);
      this.setState({
        currentChildNo: subjectNo,
      })
    };

    PubSub.subscribe('leadsToUpdate', switchSubject.bind(this));
  }

  render(){
    const playlist = this.props.playlist;
    const element = playlist.children[this.state.currentChildNo];
    console.log('element', element, this.state.currentChildNo);

    return (
      <div className="playlist">
        { 
          element["#name"] === "subject"?
            <Subject {...element.attributes} text={element.text} playlist={element} />
            :
            <p>You did not write the playlist tag</p>
        }
      </div>
    );
  }
}

class Subject extends Component {
  constructor(props) {
    super(props);
    console.log(props.playlist);
    this.state = {
      currentChildNo: 0
    }
  }

  // componentWillReceiveProps(nextProps){
  //   console.log(this.props, nextProps);
  //   if(this.props.parentState !== nextProps.parentState){
  //     this.setState({
  //       parentState: nextProps.parentState
  //     })
  //   }
  // }

  render(){
    const playlist = this.props.playlist;
    const element = playlist.children[this.state.currentChildNo];
    console.log('element', element, element["#name"], this.state.currentChildNo);
    return(
      <div className="subject">
          {
            element["#name"] === "media"?
            <Media {...element.attributes} text={element.text} playlist={element} />
            :
            null
          }
          {
            element["#name"] === "sequence"?
            <Sequence {...element.attributes} text={element.text} playlist={element} />
            :
            null
          }
          {
            element["#name"] !== "sequence" &&
            element["#name"] !== "media"?
            <p>You did not write the media or sequence tag</p>
            :
            null
          }
      </div>
    );
  }
}

// class SubjectRenderer extends Component { //playlist
//   constructor(props) {
//     super(props);
//     this.state = {
//       currentSubjectNo: 0,
//     }
//   }

//   render(){
//     const subjectElement = playlist.ximpel.playlist[0].children[this.state.currentSubjectNo];
//     console.log('subjectRenderer render', this.state);
//     return (
//       <div className="playlist">
//         {
//           <div className="subjectRenderer">
//             { 
//               React.createElement(eval("Subject"), 
//                 {...subjectElement.attributes, text: subjectElement.text, parentState: this.state}, null)
//             }
//           </div>
//         }
//       </div>
//     );
//   }

  //  // all pub-subs are here
  // componentWillMount(){
  
  //   const switchSubject = (topic, subjectNo) => {
  //     console.log('switchSubject', subjectNo);
  //     this.setState({
  //       ...this.state,
  //       currentSubjectNo: subjectNo,
  //     }, () => {
  //       const subjectElement = playlist.ximpel.playlist[0].children[this.state.currentSubjectNo];
  //       this.setState({
  //         ...this.state,
  //         subjectElement: subjectElement
  //       }, () => {
  //         console.log('this.state');
  //         console.log(this.state);
  //       })
  //     });
  //   };

  //   PubSub.subscribe('leadsToUpdate', switchSubject.bind(this));
  // }
// }

//looks within the media tag for media items
class Media extends Component {
  constructor(props) {
    super(props);
    console.log(props.playlist);
  }

  render(){
    const playlist = this.props.playlist;
    const children = playlist.children;
    console.log('children Media', children);
    return(
      <div className="media">
        {
          children.map( (element, i) => {
            switch(element["#name"]){
              case "p":
                return  (<p {...element.attributes} key={i}>
                          {element.text}
                        </p>);
              case "video":
                  return <Video {...element.attributes} text={element.text} playlist={element} key={i}/>
              default:
                  return <p key={i}>Available tags are: video, image and p. You wrote {element["#name"]}</p>
            }
          })
        }
      </div>
    );
  }
}

class Video extends Component {
  constructor(props) {
    super(props);
    console.log(props.playlist);

    //setting the key is needed because when <source> changes, then <video> needs to change as well.
    this.state = {
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
    console.log('video end', event);
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
    const playlist = this.props.playlist;
    const children = playlist.children;
    console.log('children Video', children);
    
    return(
      <div className="video">
        <video ref={node => this.video = node} preload="none" autoPlay style={styles} key={this.state.key} onEnded={e => this.handleEnd(e) }>
          {
            children.map( (element, i) => 
              element["#name"] === "source"? 
              <Source {...element.attributes} text={element.text} playlist={element} key={i} />
              :
              null
            )
          }
        </video>
          {
            children.map( (element, i) => 
              element["#name"] === "overlay"? 
              <Overlay {...element.attributes} text={element.text} playlist={element} key={i} />
              :
              null
            )
          }
          {
            children.map( (element, i) => 
              element["#name"] !== "overlay" &&
              element["#name"] !== "source"? 
              <p key={i}>Available tags are: source and overlay. You wrote {element["#name"]}</p>
              :
              null
            )
          }
      </div>
    );
  }
}

class Source extends Component {
  constructor(props) {
    super(props);
    console.log(props.playlist);
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
      <source src={file+'.'+extensions} type={types} />
    );
  }
}



class Sequence extends Component {
  constructor(props){
    super(props);
  }

  render(){
    return(
      <div>
        Sequence
      </div>
    )
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

class Video2 extends MediaType {
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
    console.log('video render');
    console.log(this);
    return(
       <div>
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
          Video
      </div>
    );
  }
}

class Source2 extends MediaType {
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
        // ...this.state,
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
  }

  render() {
    return (
      <div className="ximpel-app">
        hot reload is possible!! 
        { playlist.ximpel? <Ximpel playlist={playlist.ximpel}/> : <p>You did not write the ximpel tag</p> }
      </div>
    );
  }
}

export default App;