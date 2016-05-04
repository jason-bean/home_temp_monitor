var dtFormat = 'm/d/yyyy h:MM TT';

var HomeTempUI = React.createClass({
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
        fetch('/Temps/DateRange?startDate=' + startDate.getTime() + '&endDate=' + endDate.getTime()).then(function(response) {
            return response.json();
        }).then(function(data) {
            var minTemp;
            var maxTemp;
            var avgTemp;
            var totalTemp = 0;
            
            console.log('data length: ' + data.length);
            data.forEach(function(value, index) {
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
            <div className="homeTempUI">
                <div id="header" className="row">
                    <p id="pageTitle" className="col-sm-12 col-md-12">Bean House Temperature Log</p>
                    <CurrentTemps currentTemps={this.state.currentTemps} />
                    <TempRangeForm onRangeChange={this.handleRangeChange} rangeValue={this.state.rangeValue} />
                </div>
                <TempChart tempData={this.state.tempData} rangeValue={this.state.rangeValue} />
                <div id="statsArea" className="row">
                    <TempMinMaxAvg minTemp={this.state.minTemp} maxTemp={this.state.maxTemp} avgTemp={this.state.avgTemp} />
                    <TempLastHour tempLastHour={this.state.tempLastHour} />
                </div>
            </div>
        );
    } 
});

var CurrentTemps = React.createClass({
    render: function() {
        var currentTemps = this.props.currentTemps;
        return (
            <p className="currentTemps col-sm-12 col-md-12">
                <span className="hidden-xs"><strong>Current Temperature:</strong></span>
                <span className="hidden-sm hidden-md hidden-lg"><strong>Current Temp:</strong></span>
                &nbsp;{currentTemps.inside.toFixed(2)} °F
            </p>
        );
    }
});

var TempRangeForm = React.createClass({
    render: function() {
        return (
            <form>
                <select id="lstDataRange" className="form-control" onChange={this.props.onRangeChange} data-icon="false" value={this.props.rangeValue}>
                    <option value="24">Last 24 Hours</option>
                    <option value="48">Last 48 Hours</option>
                    <option value="168">Last Week</option>
                    <option value="720">Last Month</option>
                    <option value="2160">Last 3 Months</option>
                    <option value="4320">Last 6 Months</option>
                    <option value="8760">Last Year</option>
                </select>
            </form>
        );
    }
});

var TempChart = React.createClass({
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
            <div className="row">
                <div id="chartArea" className="col-md-12 col-sm-12 col-xs-12">
                    <span id="chartTitle">Temperature Chart</span>
                    <div id="chart_div"></div>
                </div>
            </div>
        );
    }
});

var TempMinMaxAvg = React.createClass({
    render: function() {
        return (
            <div id="minMaxAvg" className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
                <table id="minTempTable" className="stats col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <caption>
                        <span className="hidden-xs">Minimum Temperature</span>
                        <span className="hidden-lg hidden-md hidden-sm">Min Temp</span>
                    </caption>
                    <tbody>
                        <tr>
                            <td>{dateFormat(new Date(+this.props.minTemp['x']), dtFormat)}</td>
                            <td>{this.props.minTemp['y'].toFixed(2)} °F</td>
                        </tr>
                    </tbody>
                </table>
                <table id="maxTempTable" className="stats col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <caption>
                        <span className="hidden-xs">Maximum Temperature</span>
                        <span className="hidden-lg hidden-md hidden-sm">Max Temp</span>
                    </caption>
                    <tbody>
                        <tr>
                            <td>{dateFormat(new Date(+this.props.maxTemp['x']), dtFormat)}</td>
                            <td>{this.props.maxTemp['y'].toFixed(2)} °F</td>
                        </tr>
                    </tbody>
                </table>
                <table id="avgTempTable" className="stats col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <caption>
                        <span className="hidden-xs">Average Temperature</span>
                        <span className="hidden-lg hidden-md hidden-sm">Avg Temp</span>
                    </caption>
                    <tbody>
                        <tr>
                            <td>{this.props.avgTemp.toFixed(2)} °F</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
});

var TempLastHour = React.createClass({
    render: function() {
        console.log('tempLastHour length: ' + this.props.tempLastHour.length);
        var tempNodes = this.props.tempLastHour.map(function(temp) {
            return (
                <tr key={temp._id}>
                    <td>{dateFormat(new Date(+temp['x']), dtFormat)}</td>
                    <td>{temp['y'].toFixed(2)} °F</td>
                </tr>
            );
        });
        
        return (
            <div id="lastHour" className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
                <table id="tblLastTemps" className="stats col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <caption>
                        <span className="hidden-xs">Readings For Last Hour</span>
                        <span className="hidden-lg hidden-md hidden-sm">Last Hour</span>
                    </caption>
                    <thead>
                        <tr><th>Date/Time</th><th>Temperature</th></tr>
                    </thead>
                    <tbody>
                        {tempNodes}
                    </tbody>
                </table>
            </div>
        );
    }
});

ReactDOM.render(
    <HomeTempUI currentPollInterval={60000} tempDataPollInterval={900000} initialRange={24} />,
    document.getElementById('content')
);