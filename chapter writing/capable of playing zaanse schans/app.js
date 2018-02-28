import React, { Component } from 'react';
import './App.css';
// import playlist from './playlist.xml';
import playlist from './playlist_zaanse_schans.xml';
import pubSub from './pubsub.js'
import YouTubePlayer from './YouTube.js';

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