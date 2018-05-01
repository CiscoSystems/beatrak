import React from 'react';
import GoogleMapReact from "google-map-react";

const H_SIZE = 30;
const W_SIZE = 60;
const H_STICK = 40;
const W_STICK = 3;
const R_CIRCLE = 8;


const SignalMarkerStyle  = {
    //    position: 'relative',
    position: "absolute",
    color: "black",
    //    background: 'lightgray',
    background: "white",
    //    border: "2px solid #f44336",
    opacity: 0.9,
    border: "2px solid green",
    textAlign: "center",
    height: H_SIZE,
    width: W_SIZE,
    top: -(H_SIZE / 2 + H_STICK),
    left: -W_SIZE / 2
};

const SignalMarkerHoverStyle  = {
    ...SignalMarkerStyle,
    border: "4px solid green",
    opacity: 1,
    cursor: "pointer",
    zIndex: 1000
};


const SignalStickStyle  = {
    position: "absolute",
    opacity: 0.9,
    top: -H_STICK,
    height: H_STICK,
    width: W_STICK,
    backgroundColor: 'green'
};

const SignalStickHoverStyle  = {
    ...SignalStickStyle,
    width: W_STICK + 1,
    opacity: 1,
    cursor: "pointer",
    zIndex: 1000
};



const SignalCircleStyle  = {
    position: "absolute",
    opacity: 0.9,
    height: R_CIRCLE,
    width: R_CIRCLE,
    top: -R_CIRCLE / 2,
    left: -R_CIRCLE / 2 + W_STICK / 2,
    borderRadius: R_CIRCLE,
    backgroundColor: "green"
};

const SignalCircleHoverStyle  = {
    ...SignalCircleStyle,
    opacity: 1,
    cursor: "pointer",
    height: R_CIRCLE + 2,
    width: R_CIRCLE + 2,
    borderRadius: R_CIRCLE + 2,
    zIndex: 1000
};

class SignalMarker extends React.Component {
    render = () => {
	const circleStyle = this.props.$hover ? SignalCircleHoverStyle : SignalCircleStyle;
	const stickStyle = this.props.$hover ? SignalStickHoverStyle : SignalStickStyle;
	const markerStyle = this.props.$hover ? SignalMarkerHoverStyle : SignalMarkerStyle;

	// just because I can ;))
	let clustersString = (() => {
	    let s = "{";
	    for(let cluster in  this.props.clusters) {
		// console.log("SignalMarker: cluster = " + cluster);
		s += (cluster === "0" ? "" : ",") +  this.props.clusters[cluster];
	    }
	    return s + "}";
	})();


	return (
	    <div>
	      <div style={circleStyle}/>
	      <div style={stickStyle}/>
	      <div style={markerStyle}>
		<div>
		  <b>{this.props.text}</b>
		</div>
		<i>{clustersString}</i>
	      </div>
	    </div>
	);
    }
}



class SignalMap extends React.Component {
    constructor(props) {
	super(props)

	console.log("<SignalMap>: constructor(): props = ", props)
	
	this.state = {
	    center: {lat: 50.8386789, lng: 4.32},
	    zoom: 6
	    //signals: null
	};
    } // constructor


    getClusters = (signals,signal) => {
	// map returning {loc_name: "brussels", stage1_cluster : "cla"}, {loc_name: "brussels", stage1_cluster : "clb"}
	let clusters = signals.map(s => {return {"loc_name" : s.loc.name, "stage1_cluster" : s.stage1_cluster}}).filter((pair, index, pairs) => {
	    return pair.loc_name === signal.loc.name && pairs.indexOf(pair) === index
	}).map((pair) => {return pair.stage1_cluster});
	//console.log("clusters = ", clusters);
	return clusters;
    }

    
    render() {
	const {
	    signals
	} = this.props;
	//console.log("render(): signals = ", signals);
	return (
	    <GoogleMapReact
	      bootstrapURLKeys={{
		  key: "AIzaSyD7Z-STVgCAuQ2OKnFCD7OdXV--bA-5UN0"
	      }}
              defaultCenter={this.state.center}
              defaultZoom={this.state.zoom}
	      >
			   {signals.map(signal =>
 					<SignalMarker key={signal.beacon_id + ":" + signal.stage1_id}
			                lat={signal.loc.lonlat.split(',')[0]} 
			                lng={signal.loc.lonlat.split(',')[1]} 
				        text={signal.loc.name}
					clusters={this.getClusters(signals,signal)}
			                />
			   )}
			   
	    </GoogleMapReact>
	);
    }
}

export default SignalMap




