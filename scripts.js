/*
	With reference to: https://bost.ocks.org/mike/map/

*/

window.onload = function(){
    makeCharts();
};


const MAP_WIDTH = 850;
const SIDE_WIDTH = 400;
const HEIGHT = 600;
const MARGINS = {top: 0, bottom: 200, left: 0, right: 150};
const ROSEWIDTH = 200;
const ROSEHEIGHT = 200;
//let minHappiness;
//let maxHappiness;

let ext_svg = {};


function makeCharts(){
	// following setup needed for rose chart
	var roseSvg = d3.select("svg"),
		width = ROSEWIDTH,
		height = ROSEHEIGHT,
		margin = {top: 40, right: 80, bottom: 40, left: 40},
		innerRadius = 20,
		chartWidth = width - margin.left - margin.right,
		chartHeight= height - margin.top - margin.bottom,
		outerRadius = (Math.min(chartWidth, chartHeight) / 2),
		g = roseSvg.append("g").attr("transform", "translate(" + (width) + "," + (HEIGHT + 100) + ")"); // <---- This is where you play with it's position

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


    //Get the data
    d3.csv("HappinessAlcoholConsumption.csv").then(useTheData)

    // Use the data!
    function useTheData(data) {
		let mapSvg = d3.select('#map')
					.attr('width', MAP_WIDTH + MARGINS.left + MARGINS.right + SIDE_WIDTH)
					.attr('height', HEIGHT + MARGINS.top + MARGINS.bottom);
		
		const projection = d3.geoMercator()
			.scale(130)
			.translate( [(MAP_WIDTH / 2), 400]);

		const path = d3.geoPath().projection(projection);
		
		minMaxHappiness = {	min: d3.min(data, d => {return parseFloat(d.HappinessScore);}),
					 	max: d3.max(data, d => {return parseFloat(d.HappinessScore);})};
		minHappiness = d3.min(data, d => {return parseFloat(d.HappinessScore);});
		maxHappiness = d3.max(data, d => {return parseFloat(d.HappinessScore);});
		
		minMaxWine = {	min: d3.min(data, d => {return parseFloat(d.Wine_PerCapita);}),
					 	max: d3.max(data, d => {return parseFloat(d.Wine_PerCapita);})};
		minMaxBeer = {	min: d3.min(data, d => {return parseFloat(d.Beer_PerCapita);}),
					 	max: d3.max(data, d => {return parseFloat(d.Beer_PerCapita);})};
		minMaxSpirits = {	min: d3.min(data, d => {return parseFloat(d.Spirit_PerCapita);}),
					 	max: d3.max(data, d => {return parseFloat(d.Spirit_PerCapita);})};
		
		const colorScale = d3.scaleLinear()
			.domain([minMaxHappiness.min, minMaxHappiness.min + (minMaxHappiness.max - minMaxHappiness.min)/2, minMaxHappiness.max])
			.range(["red", "orange", "cyan"]);
		
		//Generate fillable glasses
		
		//Use these for the mouse over effect
//		generateWineGlass([minMaxWine.min, minMaxWine.max]);
//		generateBeerGlass([minMaxBeer.min, minMaxBeer.max]);
//		generateMartiniGlass([minMaxSpirits.min, minMaxSpirits.max]);
		
		//Calculate totals for world summary
		let totalWinePerCapita = d3.sum(data, d => {return d.Wine_PerCapita; }); 
		let totalBeerPerCapita = d3.sum(data, d => {return d.Beer_PerCapita; }); 
		let totalSpiritPerCapita = d3.sum(data, d => {return d.Spirit_PerCapita; });
		let totalPerCapita = totalWinePerCapita + totalBeerPerCapita + totalSpiritPerCapita; 
		let avgHappiness = d3.mean(data, d => {return d.HappinessScore;});
		
		//Use these for the world % of total
		generateWineGlass([0, 1]).then(() => {updateGlassFill(ext_svg.wineGlass, totalWinePerCapita / totalPerCapita);});
		generateBeerGlass([0, 1]).then(() => {updateGlassFill(ext_svg.beerGlass, totalBeerPerCapita / totalPerCapita);});
		generateMartiniGlass([0,1]).then(() => {updateGlassFill(ext_svg.martiniGlass, totalSpiritPerCapita / totalPerCapita);});
		generateSmile([minMaxHappiness.min, minMaxHappiness.max]).then(() => {updateGlassFill(ext_svg.smile, avgHappiness); ext_svg.smile.fill.style('fill', colorScale(avgHappiness));});
		
		let HACData = {};

		data.forEach(d => {
			//Special case remappings for countries that have different names between our data and the map data
			switch(d.Country)
			{
				case "Cote d'Ivoire":
					HACData['Ivory Coast'] = d;
					break;
				case "Dem. Rep. Congo":
					HACData['Democratic Republic of the Congo'] = d;
					break;
				case "Rep. Congo":
					HACData['Republic of the Congo'] = d;
					break;
				case "Russian Federation":
					HACData['Russia'] = d;
					break;
				case 'United Kingdom':
					HACData['England'] = d;
					break;
				case 'United States':
					HACData['USA'] = d;
					break;
				default:
				HACData[d.Country] = d;
				break;	
			}
			
		})

		var div = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

		d3.json('world_countries.json').then((map_data) => {
			map_data.features.forEach( d => {
				d.happiness = (HACData[d.properties.name] || {HappinessScore: null}).HappinessScore
				d.beer = (HACData[d.properties.name] || {Beer_PerCapita: null}).Beer_PerCapita
				d.spirit = (HACData[d.properties.name] || {Spirit_PerCapita: null}).Spirit_PerCapita
				d.wine = (HACData[d.properties.name] || {Wine_PerCapita: null}).Wine_PerCapita
			});
			
			//Draw map background
			mapSvg.append('rect')
				.attr('width', MAP_WIDTH)
				.attr('height', HEIGHT)
				.style('fill', 'cornflowerblue');
						
			//Draw countries onto map
			mapSvg.append('g')
				.attr('class', 'countries')
				.selectAll('path')
				.data(map_data.features)
				.enter()
				.append('path')
				.attr('class', d => {return 'country-' + d.id;})
				.attr('d', path)
				.style('fill', d => {return d.happiness ? colorScale(parseFloat(d.happiness)) : 'white';})
				.style('opacity', d => {return d.happiness ? 1.0 : 0.6;})
				.style('stroke', 'black')
				.style('stroke-width', 0.3)
				//Tooltips!
				.on('mousemove',function(d){
				
					if(d.happiness)
					{
						div.html('<span class="title">' + d.properties.name + "</span></br> Wine: " + d.wine +  "</br>Spirits: " + d.spirit + "</br> Beer: " +d.beer)
							.style("opacity", 1)
							.style("left", (d3.event.pageX) - div.node().clientWidth/2 + "px")
							.style("top", (d3.event.pageY - div.node().clientHeight - 10) + "px");
							
						//Update glassses fill levels
//						updateGlassFill(ext_svg.wineGlass, d.wine);
//						updateGlassFill(ext_svg.beerGlass, d.beer);
//						updateGlassFill(ext_svg.martiniGlass, d.spirit);
						
					}
				})
				.on('mouseout', function(d){
					div.style("opacity", 0)
				});
		
		
			
			let mapLegendLinearScale = d3.scaleLinear()
										.domain([minMaxHappiness.min, minMaxHappiness.max])
										.range([HEIGHT - 20, 20]);
			
			//Draw map legend
			let legend = mapSvg.append('g');
			legend.append('rect')
				.attr('x', MAP_WIDTH)
				.attr('width', 10)
				.attr('height', HEIGHT)
				.attr('class', 'legend')
				.attr('transform', `rotate(180, ${MAP_WIDTH + 10 / 2}, ${HEIGHT / 2})`) //Flip scale so Happy is on top
				.attr('fill', 'url("#gradient")');
			
			//Build Gradient
			/*
				References: https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient.html
			*/
			
			let defs = mapSvg.append('defs');
    		let linearGradient = defs.append("linearGradient")
									.attr("id", "gradient")
									.attr('gradientTransform','rotate(90)');
			 linearGradient.selectAll("stop")
				.data( colorScale.range() )
				.enter().append("stop")
				.attr("offset", function(d,i) { return i/(colorScale.range().length-1); })
				.attr("stop-color", function(d) { return d; });
			
			//Legend axis
			legend.selectAll('text.legend')
				.data(colorScale.nice().ticks(10))
				.enter()
				.append('text')
				.attr('class', 'legend')
				.attr('x', MAP_WIDTH + 15)
				.attr('y', (d) => {return mapLegendLinearScale(d);})
				.style('text-anchor', 'start')
				.text((d) => {return d;});
			
			//Legend label
			legend.append('text')
				.attr('class', 'legend-label')
				.attr('x', MAP_WIDTH + 70)
				.attr('y', HEIGHT / 2)
				.style('text-anchor', 'middle')
				.text('Happiness Score')
				.attr('transform', `rotate(90, ${MAP_WIDTH + 70}, ${HEIGHT/2})`);
			
			legend.append('text')
				.attr('class', 'legend-label')
				.attr('x', MAP_WIDTH + 50)
				.attr('y', HEIGHT - 10)
				.style('text-anchor', 'start')
				.text('Unhappy');
			
			legend.append('text')
				.attr('class', 'legend-label')
				.attr('x', MAP_WIDTH + 50)
				.attr('y', 20)
				.style('text-anchor', 'start')
				.text('Happy');			
		});
		
		// Functions for generating fillable glasses
		function updateGlassFill(glassData, fillAmount)
		{
			glassData.fill.attr('height', glassData.scale(fillAmount))
					.attr('y', glassData.maxHeight + (glassData.y - glassData.scale(fillAmount)));
		}

		async function generateWineGlass(minmax)
		{
			d3.selectAll('#wineglass').remove();

			await d3.xml('wineglass.svg').then((wineGlass) => {
				mapSvg.node().appendChild(wineGlass.getElementsByTagName('svg')[0]);


				let glass = mapSvg.select("#wineglass")
					.attr('x', MAP_WIDTH + MARGINS.right + 100)
					.attr('y', 50);

				let fill = glass.select('#fill');

				let maxHeight = fill.node().height.baseVal.value;
				let y = fill.node().y.baseVal.value;

				let wineScale = d3.scaleLinear().range([0, maxHeight]).domain(minmax);

				ext_svg.wineGlass = {glass: glass, scale: wineScale, fill: fill, y: y, maxHeight: maxHeight};
			});
		}

		async function generateBeerGlass(minmax)
		{
			d3.selectAll('#beerglass').remove();

			await d3.xml('beerglass.svg').then((glassSvg) => {
				mapSvg.node().appendChild(glassSvg.getElementsByTagName('svg')[0]);


				let glass = mapSvg.select("#beerglass")
					.attr('x', MAP_WIDTH + MARGINS.right + 100)
					.attr('y', 200);

				let fill = glass.select('#fill');

				let maxHeight = fill.node().height.baseVal.value;
				let y = fill.node().y.baseVal.value;

				let beerScale = d3.scaleLinear().range([0, maxHeight]).domain(minmax);

				ext_svg.beerGlass = {glass: glass, scale: beerScale, fill: fill, y: y, maxHeight: maxHeight};
			});
		}

		async function generateMartiniGlass(minmax)
		{
			d3.selectAll('#martiniglass').remove();

			await d3.xml('martiniglass.svg').then((glassSvg) => {
				mapSvg.node().appendChild(glassSvg.getElementsByTagName('svg')[0]);


				let glass = mapSvg.select("#martiniglass")
					.attr('x', MAP_WIDTH + MARGINS.right + 100)
					.attr('y', 350);

				let fill = glass.select('#fill');

				let maxHeight = fill.node().height.baseVal.value;
				let y = fill.node().y.baseVal.value;

				let spiritScale = d3.scaleLinear().range([0, maxHeight]).domain(minmax);

				ext_svg.martiniGlass = {glass: glass, scale: spiritScale, fill: fill, y: y, maxHeight: maxHeight};
			});
		}
		
		async function generateSmile(minmax)
		{
			d3.selectAll('#smile').remove();

			await d3.xml('smile.svg').then((glassSvg) => {
				mapSvg.node().appendChild(glassSvg.getElementsByTagName('svg')[0]);


				let glass = mapSvg.select("#smile")
					.attr('x', MAP_WIDTH + MARGINS.right + 100 - 12.5)
					.attr('y', 500);

				let fill = glass.select('#fill');

				let maxHeight = fill.node().height.baseVal.value;
				let y = fill.node().y.baseVal.value;

				let happinessScale = d3.scaleLinear().range([0, maxHeight]).domain(minmax);

				ext_svg.smile = {glass: glass, scale: happinessScale, fill: fill, y: y, maxHeight: maxHeight};
			});
		}

		//Rose chart code
		var dataset = data;
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


		var roseLegend = g.append("g")
			.selectAll("g")
			.data(regionsByAlcohol4.columns.slice(1).reverse())
			.enter().append("g")
			.attr("transform", function(d, i) { return "translate(" + (outerRadius+0) + "," + (-outerRadius + 40 +(i - (regionsByAlcohol4.columns.length - 1) / 2) * 20) + ")"; });

		roseLegend.append("rect")
			.attr("width", 18)
			.attr("height", 18)
			.attr("fill", z);

		roseLegend.append("text")
			.attr("x", 24)
			.attr("y", 9)
			.attr("dy", "0.35em")
			.text(function(d) { return d; })
			.style("font-size",12);
	}
}

