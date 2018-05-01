//-*- mode: rjsx;-*-, eval: (auto-fill-mode 1); -*-
import React from 'react';
import './App.css';
import SignalTable from "./SignalTable.jsx";
import SignalMap from "./SignalMap.jsx";

class App extends React.Component {

    constructor(props) {
	super(props)
	this.state = {
	    counter: 0,
	    timer: null,
	    signals: [],
	};
    }

    componentDidMount = () => {
	this.tick(); // to the first tick right away

	var timer = setInterval(this.tick, 1000)
	this.setState({timer: timer})
    }

    componentWillUnmount = () => {
	this.clearInterval(this.state.timer)
    }
    

    tick = () => {
	fetch("/api/v1/signals")
	.then(res => {
	    // console.log("<App>: tick(): res => ", res)
	    return res.json()
	})
	.then(signals => {
	    // console.log("<App>: tick(): signals => ", signals)

	    this.setState({ signals });
	    //console.log("<App>: tick(): state => ", this.state)
	});
    }

  render = () => {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Le grand spectacle pour montrer la fonctionnalité de l'envoyé proxy</h1>
        </header>
	<div>
	  <SignalTable signals={this.state.signals}/>
	  <div style={{margin: "auto", marginBottom: "50px", width: '1100px', height: '600px'}}>
          <SignalMap signals={this.state.signals}/>
	  </div>
        </div>
      </div>
    );
  }
}

export default App;
