const app = {
    // Form properties
    buttons: document.getElementsByTagName('button'),
    form: document.querySelector('form'),
    formTitle: document.querySelector('form span'),
    input: document.querySelector('form input'),
    monitor: document.getElementById('monitor'),
    activity: 'activity-1',
    data: [],
    // Graph properties
    dims: null,
    svg: null,
    graph: null,
    xScale: null,
    yScale: null,
    xAxisGroup: null,
    yAxisGroup: null,
    xAxis: null,
    yAxis: null,
    line: null,
    dottedLineGroup: null,
    xDottedLine: null,
    yDottedLine: null,

    // App init
    init: function() {
        // Selection buttons listener
        for (const button of app.buttons) {
            button.addEventListener('click', app.handleSelection);
        }
        // Form submit listener
        app.form.addEventListener('submit', app.handleSubmit);
        // Init graph configuration
        app.initGraphConfig();
        // Init Firebase listener
        db.collection('activities').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(change => {
                // Catch the doc
                const doc = {...change.doc.data(), id: change.doc.id};
                // Catch the change type
                const changeType = change.type;
                // Refresh local data
                app.refreshData(doc, changeType);
            });
            app.updateGraph(app.data);
        });
    },

    // Methods: Form
    handleSelection: function(evt) {
        // Catch actiity selection
        app.activity = evt.target.getAttribute('data-activity');
        // Toggle active class
        for (const button of app.buttons) {
            button.classList.remove('active');
        }

        evt.target.classList.add('active');
        // Set form title
        app.formTitle.textContent = evt.target.textContent;
        // Refresh graph
        app.updateGraph(app.data);
    },
    
    handleSubmit: function(evt) {
        evt.preventDefault();

        const value = Number(app.input.value.trim())

        if (value) {
            app.addActivityValue(app.activity, value)
                .then(docRef => {
                    app.displayMessage(`Document written with ID: ${docRef.id}`, 'success');
                })
                .catch(error => {
                    app.displayMessage(`Error adding document: ${error}`, 'error');
                });
        }
    },

    displayMessage: function(message, type) {
        app.monitor.style.color = (type === 'success') ? 'green' : 'red';
        app.monitor.textContent = message;
        app.monitor.style.display = "block";
        setTimeout(()=> {
            app.monitor.style.display = "none";
            app.form.reset();
        }, 2000)
    },

    // Methods: Grpah
    initGraphConfig: function () {
        // Dimensions
        app.dims = {
            marginTop: 40,
            marginRight: 20,
            marginBottom: 50,
            marginLeft: 100,
            svgWidth: 560,
            svgHeight: 400
        },

        app.dims.graphWidth = 560 - app.dims.marginLeft - app.dims.marginRight,
        app.dims.graphHeight = 400 - app.dims.marginTop - app.dims.marginBottom

        // Containers settings
        app.svg = d3.select('.canvas')
            .append('svg')
            .attr('width', app.dims.svgWidth)
            .attr('height', app.dims.svgHeight);
        
        app.graph = app.svg.append('g')
            .attr('width', app.dims.graphWidth)
            .attr('height', app.dims.graphHeight)
            .attr('transform', `translate(${app.dims.marginLeft}, ${app.dims.marginTop})`);

        // Scales
        app.xScale = d3.scaleTime()
            .range([0, app.dims.graphWidth]);
        
        app.yScale = d3.scaleLinear()
            .range([app.dims.graphHeight, 0]);

        // Axis group
        app.xAxisGroup = app.graph.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${app.dims.graphHeight})`);
        
        app.yAxisGroup = app.graph.append('g')
            .attr('class', 'y-axis');

        // Line path generator
        app.line = d3.line()
            .x(d => app.xScale(new Date(d.date)))
            .y(d => app.yScale(d.value));

        // Dotted line group and elements
        app.dottedLineGroup = app.graph.append('g');

        app.xDottedLine = app.dottedLineGroup.append('line')
            .style('stroke-dasharray', 4)
            .style('opacity', 0)
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2);

        app.yDottedLine = app.dottedLineGroup.append('line')
            .style('stroke-dasharray', 4)
            .style('opacity', 0)
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2);
    },

    updateGraph: function(data) {
        // Filtering data by activity
        const filteredData = data.filter(item => item.activity === app.activity);
        // Update scale domain
        const minTime = d3.min(filteredData, d => new Date(d.date));
        const maxTime = d3.max(filteredData, d => new Date(d.date));
        app.xScale.domain([minTime, maxTime]);

        const maxValue = d3.max(filteredData, d => d.value);
        app.yScale.domain([0, maxValue]);

        // Create and call axis
        app.xAxis = d3.axisBottom(app.xScale)
            .ticks(4)
            .tickFormat(d3.timeFormat('%b %d'));
        app.yAxis = d3.axisLeft(app.yScale)
            .ticks(4)
            .tickFormat(d => `${d} $`)
        app.xAxisGroup.call(app.xAxis);
        app.yAxisGroup.call(app.yAxis);

        // Join data to circle element
        const circles = app.graph.selectAll('circle').data(filteredData);

        // Update circles
        circles
            .attr('r', 4)
            .attr('cx', d => app.xScale(new Date(d.date)))
            .attr('cy', d => app.yScale(d.value))
            .attr('fill', '#ccc');

        circles
            .enter()
            .append('circle')
                .attr('r', 4)
                .attr('cx', d => app.xScale(new Date(d.date)))
                .attr('cy', d => app.yScale(d.value))
                .attr('fill', '#ccc')
                .on('mouseover', app.handleMouseOver)
                .on('mouseout', app.handleMouseOut);

        circles
            .exit()
            .remove();

        // Update lines
        app.updateLine(filteredData);
    },

    updateLine: function(data) {
        // Sorted data by date
        const sortedData = _.sortBy(data, [d => new Date(d.date)]);
        // Join data to circle element
        const lines = app.graph.selectAll('.line').data([sortedData]);

        // D3.js update pattern
        lines
            .attr('class', 'line')
            .attr('d', app.line)
            .attr('stroke', '#00bfa5')
            .attr('stroke-width', 1)
            .attr('fill', 'none');
            
        lines
            .enter()
            .append('path')
            .attr('class', 'line')
            .attr('d', app.line)
            .attr('stroke', '#00bfa5')
            .attr('stroke-width', 1)
            .attr('fill', 'none');
            
        lines
            .exit()
            .remove()
    },

    handleMouseOver: function (d, i, n) {
        d3.select(n[i])
            .transition()
            .duration(100)
            .attr('r', 8)
            .attr('fill','#fff');

        app.xDottedLine
            .attr('x1', 0)
            .attr('x2', app.xScale(new Date(d.date)))
            .attr('y1', app.yScale(d.value))
            .attr('y2', app.yScale(d.value))
            .style('opacity', 1);

        app.yDottedLine
            .attr('x1', app.xScale(new Date(d.date)))
            .attr('x2', app.xScale(new Date(d.date)))
            .attr('y1', app.dims.graphHeight)
            .attr('y2', app.yScale(d.value))
            .style('opacity', 1);
    },

    handleMouseOut: function (d, i, n) {
        d3.select(n[i])
            .transition()
            .duration(100)
            .attr('r', 4)
            .attr('fill','#ccc');

        app.xDottedLine
            .style('opacity', 0);

        app.yDottedLine
            .style('opacity', 0);
    },

    // CRUD operation
    refreshData: function(doc, changeType) {
        switch (changeType) {
            case 'added':
                app.data.push(doc);
                break;
            
            case 'modified':
                app.data.forEach((element, index) => {
                    if (element.id === doc.id) {
                        app.data[index] = doc;
                    }
                })
                break;

            case 'removed':
                app.data.forEach((element, index) => {
                    if (element.id === doc.id) {
                        app.data.splice(index, 1);
                    }
                })
                break;

            default:
                break;
        }
    },

    addActivityValue: function(activity, value) {
        return db.collection("activities").add({
            activity,
            value,
            date: new Date().toString()
        });
    },
};

document.addEventListener('DOMContentLoaded', app.init);