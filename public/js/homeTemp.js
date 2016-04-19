var dtFormat = 'm/d/yyyy h:MM TT';

var HomeTempUI = React.createClass({displayName: "HomeTempUI",
    loadCurrentTempsFromServer: function() {
        fetch('/Temps/Current').then(function(response) {
            return response.json();
        }).then(function(data) {
            console.log(JSON.stringify(data));
            this.setState({currentTemps: data});
        }.bind(this));
    },
    loadTempDataFromServer: function() {
        var endDate = new Date();
        var startDate = new Date(endDate);
        var hours = this.state.rangeValue;
        console.log('hours: ' + hours);
        startDate.setTime(startDate.getTime() - hours * 3600000);
        var outData = {};
        outData['startDate'] = startDate;
        outData['endDate'] = endDate;
        fetch('/Temps/DateRange?startDate=' + startDate.toISOString() + '&endDate=' + endDate.toISOString()).then(function(response) {
            return response.json();
        }).then(function(data) {
            var minTemp;
            var maxTemp;
            var avgTemp;
            var totalTemp = 0;
            
            console.log('data length: ' + data.length);
            data.forEach(function(value, index) {
                value['x'] = Number(value['x']);
                
                totalTemp += value['y'];
        
                if (index === 0) {
                    minTemp = value;
                    maxTemp = value;
                } else {
                    if (value['y'] <= minTemp['y']) {
                        minTemp = value;
                    } else if (value['y'] >= maxTemp['y']) {
                        maxTemp = value;
                    }
                }
            });
            
            avgTemp = totalTemp / data.length;
            
            this.setState({tempData: data, minTemp: minTemp, maxTemp: maxTemp, avgTemp: avgTemp, tempLastHour: data.slice(data.length - 4, data.length)}, function() {
                document.getElementById('updatedTime').innerHTML = dateFormat(Date.now(), 'm/d/yyyy h:MM:ss TT');
            });
        }.bind(this));
    },
    getInitialState: function() {
        return {
            currentTemps: {inside: 0.0, outside: 0.0},
            rangeValue: this.props.initialRange,
            tempData: [],
            minTemp: {x: new Date(), y: 0.0},
            maxTemp: {x: new Date(), y: 0.0},
            avgTemp: 0.0,
            tempLastHour: []
        };
    },
    componentDidMount: function() {
        this.loadCurrentTempsFromServer();
        setInterval(this.loadCurrentTempsFromServer, this.props.currentPollInterval);
        this.loadTempDataFromServer();
        setInterval(this.loadTempDataFromServer, this.props.tempDataPollInterval);
    },
    handleRangeChange: function(event) {
        this.setState({rangeValue: event.target.value}, function() {
            this.loadTempDataFromServer();
        });
    },
    render: function() {
        return (
            React.createElement("div", {className: "homeTempUI"}, 
                React.createElement("div", {style: {textAlign: 'center'}, className: "row"}, 
                    React.createElement("p", {id: "pageTitle", className: "col-sm-12 col-md-12"}, "Bean House Temperature Log"), 
                    React.createElement(CurrentTemps, {currentTemps: this.state.currentTemps}), 
                    React.createElement(TempRangeForm, {onRangeChange: this.handleRangeChange, rangeValue: this.state.rangeValue})
                ), 
                React.createElement(TempChart, {tempData: this.state.tempData, rangeValue: this.state.rangeValue}), 
                React.createElement("div", {id: "statsArea", className: "row"}, 
                    React.createElement(TempMinMaxAvg, {minTemp: this.state.minTemp, maxTemp: this.state.maxTemp, avgTemp: this.state.avgTemp}), 
                    React.createElement(TempLastHour, {tempLastHour: this.state.tempLastHour})
                )
            )
        );
    } 
});

var CurrentTemps = React.createClass({displayName: "CurrentTemps",
    render: function() {
        var currentTemps = this.props.currentTemps;
        return (
            React.createElement("p", {className: "currentTemps col-sm-12 col-md-12"}, 
                React.createElement("span", {className: "hidden-xs"}, React.createElement("strong", null, "Current Temperature:")), 
                React.createElement("span", {className: "hidden-sm hidden-md hidden-lg"}, React.createElement("strong", null, "Current Temp:")), 
                " ", currentTemps.inside.toFixed(2), " °F"
            )
        );
    }
});

var TempRangeForm = React.createClass({displayName: "TempRangeForm",
    render: function() {
        return (
            React.createElement("form", null, 
                React.createElement("select", {id: "lstDataRange", className: "lstDataRange", onChange: this.props.onRangeChange, "data-icon": "false", value: this.props.rangeValue}, 
                    React.createElement("option", {value: "24"}, "Last 24 Hours"), 
                    React.createElement("option", {value: "48"}, "Last 48 Hours"), 
                    React.createElement("option", {value: "168"}, "Last Week"), 
                    React.createElement("option", {value: "720"}, "Last Month"), 
                    React.createElement("option", {value: "2160"}, "Last 3 Months"), 
                    React.createElement("option", {value: "4320"}, "Last 6 Months"), 
                    React.createElement("option", {value: "8760"}, "Last Year")
                )
            )
        );
    }
});

var TempChart = React.createClass({displayName: "TempChart",
    renderChart: function() {
        var lineThickness = 1.0;
        var selectedValue = parseInt(this.props.rangeValue);
        if (navigator.userAgent.match(/iPhone/i)) {
            if (selectedValue > 48)
                lineThickness = 0.5;
        }
        else if (navigator.userAgent.match(/iPad/i)) {
            if (selectedValue > 168)
                lineThickness = 0.5;
        }
        
        document.getElementById('chart_div').innerHTML = '';
        var chart = new CanvasJS.Chart('chart_div', {
            data: [
                {
                    type: 'line',
                    xValueType: 'dateTime',
                    markerType: 'none',
                    color: 'blue',
                    lineThickness: lineThickness,
                    dataPoints: this.props.tempData
                }
            ],
            axisY: {
                title: 'Temperature (°F)',
                titleFontSize: 18,
                titleFontStyle: 'italic',
                labelFontSize: 12,
                includeZero: false
            },
            axisX: {
                labelAngle: -45,
                labelFontSize: 12,
                valueFormatString: 'M/D/YYYY h:mm TT'
            },
            toolTip: {
                content: 'Recorded: {x}<br/>Temperature: {y} °F'
            }
        });

        chart.render();
    },
    componentDidMount: function() {
        this.renderChart();
    },
    componentDidUpdate: function() {
        this.renderChart();
    },
    render: function() {
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {id: "chartArea", className: "col-md-12 col-sm-12 col-xs-12"}, 
                    React.createElement("span", {id: "chartTitle"}, "Temperature Chart"), 
                    React.createElement("div", {id: "chart_div"})
                )
            )
        );
    }
});

var TempMinMaxAvg = React.createClass({displayName: "TempMinMaxAvg",
    render: function() {
        return (
            React.createElement("div", {id: "minMaxAvg", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12"}, 
                React.createElement("table", {id: "minTempTable", className: "stats col-lg-12 col-md-12 col-sm-12 col-xs-12"}, 
                    React.createElement("caption", null, 
                        React.createElement("span", {className: "hidden-xs"}, "Minimum Temperature"), 
                        React.createElement("span", {className: "hidden-lg hidden-md hidden-sm"}, "Min Temp")
                    ), 
                    React.createElement("tbody", null, 
                        React.createElement("tr", null, 
                            React.createElement("td", null, dateFormat(new Date(+this.props.minTemp['x']), dtFormat)), 
                            React.createElement("td", null, this.props.minTemp['y'].toFixed(2), " °F")
                        )
                    )
                ), 
                React.createElement("table", {id: "maxTempTable", className: "stats col-lg-12 col-md-12 col-sm-12 col-xs-12"}, 
                    React.createElement("caption", null, 
                        React.createElement("span", {className: "hidden-xs"}, "Maximum Temperature"), 
                        React.createElement("span", {className: "hidden-lg hidden-md hidden-sm"}, "Max Temp")
                    ), 
                    React.createElement("tbody", null, 
                        React.createElement("tr", null, 
                            React.createElement("td", null, dateFormat(new Date(+this.props.maxTemp['x']), dtFormat)), 
                            React.createElement("td", null, this.props.maxTemp['y'].toFixed(2), " °F")
                        )
                    )
                ), 
                React.createElement("table", {id: "avgTempTable", className: "stats col-lg-12 col-md-12 col-sm-12 col-xs-12"}, 
                    React.createElement("caption", null, 
                        React.createElement("span", {className: "hidden-xs"}, "Average Temperature"), 
                        React.createElement("span", {className: "hidden-lg hidden-md hidden-sm"}, "Avg Temp")
                    ), 
                    React.createElement("tbody", null, 
                        React.createElement("tr", null, 
                            React.createElement("td", null, this.props.avgTemp.toFixed(2), " °F")
                        )
                    )
                )
            )
        );
    }
});

var TempLastHour = React.createClass({displayName: "TempLastHour",
    render: function() {
        console.log('tempLastHour length: ' + this.props.tempLastHour.length);
        var tempNodes = this.props.tempLastHour.map(function(temp) {
            return (
                React.createElement("tr", {key: temp._id}, 
                    React.createElement("td", null, dateFormat(new Date(+temp['x']), dtFormat)), 
                    React.createElement("td", null, temp['y'].toFixed(2), " °F")
                )
            );
        });
        
        return (
            React.createElement("div", {id: "lastHour", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12"}, 
                React.createElement("table", {id: "tblLastTemps", className: "stats col-lg-12 col-md-12 col-sm-12 col-xs-12"}, 
                    React.createElement("caption", null, 
                        React.createElement("span", {className: "hidden-xs"}, "Readings For Last Hour"), 
                        React.createElement("span", {className: "hidden-lg hidden-md hidden-sm"}, "Last Hour")
                    ), 
                    React.createElement("thead", null, 
                        React.createElement("tr", null, React.createElement("th", null, "Date/Time"), React.createElement("th", null, "Temperature"))
                    ), 
                    React.createElement("tbody", null, 
                        tempNodes
                    )
                )
            )
        );
    }
});

ReactDOM.render(
    React.createElement(HomeTempUI, {currentPollInterval: 60000, tempDataPollInterval: 900000, initialRange: 24}),
    document.getElementById('content')
);