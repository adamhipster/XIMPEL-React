class SubjectRenderer extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    const data = this.props.data.ximpel;

    return (
      <div className="playlist">
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