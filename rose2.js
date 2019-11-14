window.onload = function(){
    setupBars();
};

//svg element window variables
const WIDTH = 500;
const HEIGHT = 300;

//set svg box size and return it
function configureBox(id) {
    return d3.select("#" + id)
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
        .attr("padding-left", 50);
}

function setupBars(){
    let box = configureBox("stackedBars");

    // reference: https://bl.ocks.org/ssmaroju/96af159c1872c2928a972c441bccaf50

    var svg = d3.select("svg"),
        width = WIDTH,
        height = HEIGHT,
        margin = {top: 40, right: 80, bottom: 40, left: 40},
        innerRadius = 20,
        chartWidth = width - margin.left - margin.right,
        chartHeight= height - margin.top - margin.bottom,
        outerRadius = (Math.min(chartWidth, chartHeight) / 2),
        g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var angle = d3.scaleLinear()
        .range([0, 2 * Math.PI]);

    var radius = d3.scaleLinear()
        .range([innerRadius, outerRadius]);

    var x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0);

    var y = d3.scaleLinear() //you can try scaleRadial but it scales differently
        .range([innerRadius, outerRadius]);

    var z = d3.scaleOrdinal()
        .range(["#4242f4", "#42c5f4", "#42f4ce"]);

    d3.csv("HappinessAlcoholConsumption.csv").then(makeTheChart)

    // Use the data!
    function makeTheChart(dataset) {

        for (i = 6, t = 0; i < dataset.columns.length; ++i) {
            t += dataset[dataset.columns[i]] = +dataset[dataset.columns[i]];
        }
        dataset.total = t;
        // Combine data based on alcohol, because its not usable in its current format
        var regionsByAlcohol2 = d3.nest()
            .key(function(d) { return d.Region; })
            .rollup(function(v) { return {
                Wine_PerCapita: d3.sum(v, function(d) { return d.Wine_PerCapita; }),
                Beer_PerCapita: d3.sum(v, function(d) { return d.Beer_PerCapita; }),
                Spirit_PerCapita: d3.sum(v, function(d) { return d.Spirit_PerCapita; })
            }; })
            .object(dataset);
        // console.log(regionsByAlcohol2)

        // use map to bring the arrays together
        var regionsByAlcohol3 = Object.keys(regionsByAlcohol2).map(function(key) {
            return [String(key), regionsByAlcohol2[key]];
        });
        // console.log(regionsByAlcohol3)

        // put into an array of arrays (because we got a bunch of object arrays that cant be stacked)
        var regionsByAlcohol4 = [];
        for (var i = 0; i < regionsByAlcohol3.length; i++) {
            var temp = {Region: regionsByAlcohol3[i][0], Wine_PerCapita: +regionsByAlcohol3[i][1].Wine_PerCapita, Beer_PerCapita: +regionsByAlcohol3[i][1].Beer_PerCapita, Spirit_PerCapita: +regionsByAlcohol3[i][1].Spirit_PerCapita};
            regionsByAlcohol4[i] = temp;
        }
        regionsByAlcohol4.columns = ["Region", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

        console.log(dataset);
        var countryAlcohol1 = d3.nest()
            .key(function(d) { return d.Region; })
            .object(dataset);

        var countryAlcohol2 = Object.keys(countryAlcohol1).map(function(key) {
            return [String(key), countryAlcohol1[key]];
        });
        console.log(countryAlcohol1);
        console.log(countryAlcohol2);
        console.log("test2")

        x.domain(dataset.map(function(d) { return d.Region; }));
        y.domain([0, 12000]);
        z.domain(regionsByAlcohol4.columns.slice(1));
        // Extend the domain slightly to match the range of [0, 2π].
        angle.domain([0, d3.max(regionsByAlcohol4, function(d,i) { return i + 1; })]);
        radius.domain([0, d3.max(regionsByAlcohol4, function(d) { return d.y0 + d.y; })]);
        angleOffset = -360.0/regionsByAlcohol4.length/2.0;
        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(regionsByAlcohol4.columns.slice(1))(regionsByAlcohol4))
            .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
            .selectAll("path")
            .data(function(d) { return d; })
            .enter().append("path")
            .attr("d", d3.arc()
                .innerRadius(function(d) { return y(d[0]); })
                .outerRadius(function(d) { return y(d[1]); })
                .startAngle(function(d) { return x(d.data.Region); })
                .endAngle(function(d) { return x(d.data.Region) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius))
            .attr("transform", function() {return "rotate("+ angleOffset + ")"});

        var label = g.append("g")
            .selectAll("g")
            .data(dataset)
            .enter().append("g")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "rotate(" + ((x(d.Region) + x.bandwidth() / 2) * 180 / Math.PI - (90-angleOffset)) + ")translate(" + (outerRadius+30) + ",0)"; });

        label.append("text")
            .attr("transform", function(d) { return (x(d.Region) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; })
            .text(function(d) { return d.Region; })
            .style("font-size",14);

        g.selectAll(".axis")
            .data(d3.range(angle.domain()[1]))
            .enter().append("g")
            .attr("class", "axis")
            .attr("transform", function(d) { return "rotate(" + angle(d) * 180 / Math.PI + ")"; })
            .call(d3.axisLeft()
                .scale(radius.copy().range([-innerRadius, -(outerRadius+10)])));

        var yAxis = g.append("g")
            .attr("text-anchor", "middle");

        var yTick = yAxis
            .selectAll("g")
            .data(y.ticks(5).slice(1))
            .enter().append("g");

        yTick.append("circle")
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4,4")
            .attr("r", y);

        yTick.append("text")
            .attr("y", function(d) { return -y(d); })
            .attr("dy", "-0.35em")
            .attr("x", function() { return -10; })
            .text(y.tickFormat(5, "s"))
            .style("font-size",14);


        var legend = g.append("g")
            .selectAll("g")
            .data(regionsByAlcohol4.columns.slice(1).reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(" + (outerRadius+0) + "," + (-outerRadius + 40 +(i - (regionsByAlcohol4.columns.length - 1) / 2) * 20) + ")"; });

        legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", z);

        legend.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(function(d) { return d; })
            .style("font-size",12);
    }
}


