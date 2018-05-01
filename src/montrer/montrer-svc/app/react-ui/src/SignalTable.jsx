import React from "react";
const moment = require("moment");

class SignalTable extends React.Component {
    constructor(props) {
	super(props)

	console.log("<SignalTable>: constructor(): props = ", props)
	
	this.state = {
	    signals: null
	};
    } // constructor

    componentDidMount = () => {
	console.log("<SignalTable>: componentDidMount(): start")
	console.log("<SignalTable>: componentDidMount(): this.props = ", this.props)
//	this.setState({signals: this.props.signals})
//	this.tick() // to 1 tick right away
//	var timer = setInterval(this.tick, 1000)
//	this.setState({timer: timer})
	console.log("<SignalTable>: componentDidMount(): finish")
    }

    componentWillUnmount = () => {
	console.log("<SignalTable>: unount(): start")
	this.clearInterval(this.state.timer)
    }

    tick = () => {
	//console.log("<SignalTable>: tick(): start")
	this.setState({
	    counter: this.state.counter + 1
	});
	//console.log("<SignalTable>: tick(): finish")
    }
    
    
    render() {
	const {
	    signals
	} = this.props;

//	var signals = this.state.signals;
//	console.log("<SignalTable>: render(): start")
//	console.log("<SignalTable>: render(): finish before return()")
	return (
	    <div>
	      {/*	      <p>counter = {this.state.counter}</p> */}
	      <table>
		  <tbody>
	            <tr>
      		     <th>loc.name</th>
     		     <th>loc.zone</th>
		     <th>beacon_id</th>
     		     <th>beacon_zone</th>
		     <th>stage1_id</th>
		     <th>stage1_zone</th>
		     <th>stage1_cluster</th>
		     <th>signals/s</th>
		     <th>signal %</th>
    		     <th>last</th>
		  </tr>
		    {signals.map(signal =>
			       <tr key={signal.beacon_id + ":" + signal.stage1_id}>
				     {/* <td key={signal.beacon_id + signal.stage_id}>lala</td> */}
					 <td>{signal.loc.name}</td>
					 <td>{signal.loc.zone}</td>
					 <td>{signal.beacon_id}</td>
					 <td>{signal.beacon_zone}</td>
					 <td>{signal.stage1_id}</td>
					 <td>{signal.stage1_zone}</td>
					 <td>{signal.stage1_cluster}</td>
					 <td>{signal.sps}</td>
				         <td>{signal.sp}</td>
				         <td>{moment(signal.last_ts).format("YYYY-MM-DD HH:mm:ss")}</td>
			       </tr>
	          )}
	       </tbody></table>
	    </div>
	);
	
    }

} // SignalTable

export default SignalTable
