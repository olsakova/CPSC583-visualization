/*
	With reference to: https://bost.ocks.org/mike/map/

*/

window.onload = function(){
    makeCharts();
};


//const MAP_WIDTH = 1000;
//const HEIGHT = 600;
//const MARGINS = {top: 0, bottom: 1000, left: 0, right: 150};
// const SIDE_WIDTH = 250;

let ext_svg = {};
//const values from donuts to make the code run
const MAP_WIDTH = 1000;
const SIDE_WIDTH = 260;
const HEIGHT = 600;
const MARGINS = {top: 0, bottom: 525, left: 0, right: 125};
const BARCHART_WIDTH = 160;
const BARCHART_HEIGHT = 160;

function makeCharts(){
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
		minMaxWine = {	min: d3.min(data, d => {return parseFloat(d.Wine_PerCapita);}),
					 	max: d3.max(data, d => {return parseFloat(d.Wine_PerCapita);})};
		minMaxBeer = {	min: d3.min(data, d => {return parseFloat(d.Beer_PerCapita);}),
					 	max: d3.max(data, d => {return parseFloat(d.Beer_PerCapita);})};
		minMaxSpirits = {	min: d3.min(data, d => {return parseFloat(d.Spirit_PerCapita);}),
					 	max: d3.max(data, d => {return parseFloat(d.Spirit_PerCapita);})};
		
		const colorScale = d3.scaleLinear()
			.domain([minMaxHappiness.min, minMaxHappiness.min + (minMaxHappiness.max - minMaxHappiness.min)/2, minMaxHappiness.max])
			.range(["red", "orange", "cyan"]);
		
		//Add a background behind the glasses
		mapSvg.append('rect')
			.attr('y', 0)
			.attr('x', MAP_WIDTH)
			.attr('height', HEIGHT)
			.attr('width', MARGINS.right + SIDE_WIDTH)
			.style('fill', "#DDD");
		
		//Generate fillable glasses
		
		//Use these for the mouse over effect
//		generateWineGlass([minMaxWine.min, minMaxWine.max]);
//		generateBeerGlass([minMaxBeer.min, minMaxBeer.max]);
//		generateMartiniGlass([minMaxSpirits.min, minMaxSpirits.max]);
		
		//Calculate avg for world summary
		let avgWine = d3.mean(data, d => {return d.Wine_PerCapita; }); 
		let avgBeer = d3.mean(data, d => {return d.Beer_PerCapita; }); 
		let avgSpirits = d3.mean(data, d => {return d.Spirit_PerCapita; });
		let avgHappiness = d3.mean(data, d => {return d.HappinessScore;});
		
		//Use these for the world avg
		generateWineGlass([minMaxWine.min, minMaxWine.max]).then(() => {updateGlassFill(ext_svg.wineGlass, avgWine, avgWine.toFixed(2));});
		generateBeerGlass([minMaxBeer.min, minMaxBeer.max]).then(() => {updateGlassFill(ext_svg.beerGlass, avgBeer, avgBeer.toFixed(2));});
		generateMartiniGlass([minMaxSpirits.min,minMaxSpirits.max]).then(() => {updateGlassFill(ext_svg.martiniGlass, avgSpirits, avgSpirits.toFixed(2));});
		generateSmile([minMaxHappiness.min, minMaxHappiness.max]).then(() => {
				updateGlassFill(ext_svg.smile, avgHappiness, avgHappiness.toFixed(2) +'/10'); 
			  	ext_svg.smile.fill.style('fill', colorScale(avgHappiness));
		});
		
		mapSvg.append('text')
			.attr('x', MAP_WIDTH + MARGINS.right + 100 + 25)
			.attr('y', 20)
			.style('text-anchor', 'middle')
			.text('Golbal Average');
		mapSvg.append('text')
			.attr('x', MAP_WIDTH + MARGINS.right + 100 + 25)
			.attr('y', 35)
			.style('text-anchor', 'middle')
			.style('font-size', '12px')
			.text('(litres per capita per year)');
		
		
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
		function updateGlassFill(glassData, fillAmount, label)
		{
			glassData.fill.attr('height', glassData.scale(fillAmount))
					.attr('y', glassData.maxHeight + (glassData.y - glassData.scale(fillAmount)));
			
			glassData.text.text(label);
						
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
				
				let label = mapSvg.append('text')
					.attr('x', MAP_WIDTH + MARGINS.right + 125)
					.attr('y', 170)
					.style('text-anchor', "middle")
					.text('100');
				
				ext_svg.wineGlass = {glass: glass, scale: wineScale, fill: fill, y: y, maxHeight: maxHeight, text: label};
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

				let label = mapSvg.append('text')
					.attr('x', MAP_WIDTH + MARGINS.right + 125)
					.attr('y', 320)
					.style('text-anchor', "middle")
					.text('100');
				
				ext_svg.beerGlass = {glass: glass, scale: beerScale, fill: fill, y: y, maxHeight: maxHeight, text: label};
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

				let label = mapSvg.append('text')
					.attr('x', MAP_WIDTH + MARGINS.right + 125)
					.attr('y', 470)
					.style('text-anchor', "middle")
					.text('100%');
				
				ext_svg.martiniGlass = {glass: glass, scale: spiritScale, fill: fill, y: y, maxHeight: maxHeight, text: label};
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

				let label = mapSvg.append('text')
					.attr('x', MAP_WIDTH + MARGINS.right + 125)
					.attr('y', 595)
					.style('text-anchor', "middle")
					.text('100%');
				
				ext_svg.smile = {glass: glass, scale: happinessScale, fill: fill, y: y, maxHeight: maxHeight, text: label};
			});
		}

		//Add a background behind the charts
		mapSvg.append('rect')
			.attr('y', HEIGHT)
			.attr('height', MARGINS.bottom)
			.attr('width', MAP_WIDTH + SIDE_WIDTH + MARGINS.left + MARGINS.right)
			.style('fill', "#CCC");

		mapSvg.append('text')
			.attr('y', HEIGHT + 25)
			.attr('x', (MAP_WIDTH + SIDE_WIDTH + MARGINS.left + MARGINS.right)/2)
			.style('text-anchor', 'middle')
			.text("Alcohol Consumption by Region");
		mapSvg.append('text')
			.attr('y', HEIGHT + 40)
			.attr('x', (MAP_WIDTH + SIDE_WIDTH + MARGINS.left + MARGINS.right)/2)
			.style('text-anchor', 'middle')
			.style('font-size', '12px')
			.text('(litres per capita per year)');

		buildColourLegend();

		// Combine data based on alcohol, because its not usable in its current format
		var regionsByAlcohol2 = d3.nest()
			.key(function(d) { return d.Region; })
			.rollup(function(v) { return {
				Wine_PerCapita: d3.sum(v, function(d) { return d.Wine_PerCapita; }),
				Beer_PerCapita: d3.sum(v, function(d) { return d.Beer_PerCapita; }),
				Spirit_PerCapita: d3.sum(v, function(d) { return d.Spirit_PerCapita; })
			}; })
			.object(data);

		// use map to bring the arrays together
		var regionsByAlcohol3 = Object.keys(regionsByAlcohol2).map(function(key) {
			return [String(key), regionsByAlcohol2[key]];
		});

		// put into an array of arrays (because we got a bunch of object arrays that cant be stacked)
		var regionsByAlcohol4 = [];
		for (var i = 0; i < regionsByAlcohol3.length; i++) {
			var temp = {Region: regionsByAlcohol3[i][0], Wine_PerCapita: +regionsByAlcohol3[i][1].Wine_PerCapita, Beer_PerCapita: +regionsByAlcohol3[i][1].Beer_PerCapita, Spirit_PerCapita: +regionsByAlcohol3[i][1].Spirit_PerCapita};
			regionsByAlcohol4[i] = temp;
		}
		regionsByAlcohol4.columns = ["Region", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

		var countryAlcohol1 = d3.nest()
			.key(function(d) { return d.Region; })
			.object(data);

		var countryAlcohol2 = Object.keys(countryAlcohol1).map(function(key) {
			return [String(key), countryAlcohol1[key]];
		});

		var easternEurope = countryAlcohol2[0][1];
		var easternEurope2 = [];
		for (var i = 0; i < easternEurope.length; i++) {
			var temp = {Country: easternEurope[i].Country, Wine_PerCapita: +easternEurope[i].Wine_PerCapita, Beer_PerCapita: +easternEurope[i].Beer_PerCapita, Spirit_PerCapita: +easternEurope[i].Spirit_PerCapita};
			easternEurope2[i] = temp;
		}
		easternEurope2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		console.log(easternEurope2);
		console.log("regionsByAlcohol4", regionsByAlcohol4);
		var donutData = constructDonutData(regionsByAlcohol4, 0);
		barChart(data, donutData, 0, 160, "Central and Eastern Europe");

		var subAfrica = countryAlcohol2[1][1];
		var subAfrica2 = [];
		for (var i = 0; i < subAfrica.length; i++) {
			var temp = {Country: subAfrica[i].Country, Wine_PerCapita: +subAfrica[i].Wine_PerCapita, Beer_PerCapita: +subAfrica[i].Beer_PerCapita, Spirit_PerCapita: +subAfrica[i].Spirit_PerCapita};
			subAfrica2[i] = temp;
		}
		subAfrica2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 1);
		barChart(data, donutData, 277, 160, "Sub-Saharan Africa");

		var southAmerica = countryAlcohol2[2][1];
		var southAmerica2 = [];
		for (var i = 0; i < southAmerica.length; i++) {
			var temp = {Country: southAmerica[i].Country, Wine_PerCapita: +southAmerica[i].Wine_PerCapita, Beer_PerCapita: +southAmerica[i].Beer_PerCapita, Spirit_PerCapita: +southAmerica[i].Spirit_PerCapita};
			southAmerica2[i] = temp;
		}
		southAmerica2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 2);
		barChart(data, donutData, 277 * 2, 160, "South America" );

		var aussie = countryAlcohol2[3][1];
		var aussie2 = [];
		for (var i = 0; i < aussie.length; i++) {
			var temp = {Country: aussie[i].Country, Wine_PerCapita: +aussie[i].Wine_PerCapita, Beer_PerCapita: +aussie[i].Beer_PerCapita, Spirit_PerCapita: +aussie[i].Spirit_PerCapita};
			aussie2[i] = temp;
		}
		aussie2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 3);
		barChart(data, donutData, 277 * 3, 160, "Australia & New Zealand" );

		var westernEurope = countryAlcohol2[4][1];
		var westernEurope2 = [];
		for (var i = 0; i < westernEurope.length; i++) {
			var temp = {Country: westernEurope[i].Country, Wine_PerCapita: +westernEurope[i].Wine_PerCapita, Beer_PerCapita: +westernEurope[i].Beer_PerCapita, Spirit_PerCapita: +westernEurope[i].Spirit_PerCapita};
			westernEurope2[i] = temp;
		}
		westernEurope2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 4);
		barChart(data, donutData, 0, 380, "Western Europe");

		var middleEast = countryAlcohol2[5][1];
		var middleEast2 = [];
		for (var i = 0; i < middleEast.length; i++) {
			var temp = {Country: middleEast[i].Country, Wine_PerCapita: +middleEast[i].Wine_PerCapita, Beer_PerCapita: +middleEast[i].Beer_PerCapita, Spirit_PerCapita: +middleEast[i].Spirit_PerCapita};
			middleEast2[i] = temp;
		}
		middleEast2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 5);
		barChart(data, donutData, 277 * 1, 380, "Middle East & North Africa" );

		var seAsia = countryAlcohol2[6][1];
		var seAsia2 = [];
		for (var i = 0; i < seAsia.length; i++) {
			var temp = {Country: seAsia[i].Country, Wine_PerCapita: +seAsia[i].Wine_PerCapita, Beer_PerCapita: +seAsia[i].Beer_PerCapita, Spirit_PerCapita: +seAsia[i].Spirit_PerCapita};
			seAsia2[i] = temp;
		}
		seAsia2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 6);
		barChart(data, donutData, 277 * 2, 380, "South East Asia");

		var northAmerica = countryAlcohol2[7][1];
		var northAmerica2 = [];
		for (var i = 0; i < northAmerica.length; i++) {
			var temp = {Country: northAmerica[i].Country, Wine_PerCapita: +northAmerica[i].Wine_PerCapita, Beer_PerCapita: +northAmerica[i].Beer_PerCapita, Spirit_PerCapita: +northAmerica[i].Spirit_PerCapita};
			northAmerica2[i] = temp;
		}
		northAmerica2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 7);
		barChart(data, donutData, 277 * 3, 380, "North America");

		var eastAsia = countryAlcohol2[8][1];
		var eastAsia2 = [];
		for (var i = 0; i < eastAsia.length; i++) {
			var temp = {Country: eastAsia[i].Country, Wine_PerCapita: +eastAsia[i].Wine_PerCapita, Beer_PerCapita: +eastAsia[i].Beer_PerCapita, Spirit_PerCapita: +eastAsia[i].Spirit_PerCapita};
			eastAsia2[i] = temp;
		}
		eastAsia2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]
		var donutData = constructDonutData(regionsByAlcohol4, 8);
		barChart(data, donutData, 277 * 4, 380, "Eastern Asia");
	}



	function constructDonutData(regionArray, regionIndex){
		var donutData = [{alcohol:(d3.keys(regionArray[regionIndex])[1]), consumption:(d3.values(regionArray[regionIndex])[1])},
			{alcohol:(d3.keys(regionArray[regionIndex])[2]), consumption:(d3.values(regionArray[regionIndex])[2])},
			{alcohol:(d3.keys(regionArray[regionIndex])[3]), consumption:(d3.values(regionArray[regionIndex])[3])}
		];
		return donutData;
	}

	function buildColourLegend(){

		var legendSvg = d3.select("svg");
		var legendX =  1000 + 120;
		var legendY = HEIGHT + 160 - BARCHART_HEIGHT / 2;

		legendSvg.append("rect")
			.attr("width", 40)
			.attr("height", 40)
			.attr("x", legendX)
			.attr("y", legendY)
			.style("fill", "#5c0010");
		legendSvg.append("text")
			.attr("x", legendX + 50)
			.attr("y", legendY + 20)
			.attr("dy", ".35em")
			.text("Wine Consumption");

		legendSvg.append("rect")
			.attr("width", 40)
			.attr("height", 40)
			.attr("x", legendX)
			.attr("y", legendY+70)
			.style("fill", "#d28816");
		legendSvg.append("text")
			.attr("x", legendX + 50)
			.attr("y", legendY + 90)
			.attr("dy", ".35em")
			.text("Beer Consumption");

		legendSvg.append("rect")
			.attr("width", 40)
			.attr("height", 40)
			.attr("x", legendX)
			.attr("y", legendY+140)
			.style("fill", "#00CCCC");
		legendSvg.append("text")
			.attr("x", legendX + 50)
			.attr("y", legendY + 160)
			.attr("dy", ".35em")
			.text("Spirits Consumption");
	}

	/*
        Donut Chart reference: https://scrimba.com/p/pPrZLhD/c6ZPkH3

    */
    //reused donut region, good stuff
	function barChart(dataset, customizedData, leftOffset, topOffset, regionTitle) {
		var data = customizedData;
		//var data = dataset;

		var rectSvg = d3.select("svg"),
			width = BARCHART_WIDTH,
			height = BARCHART_HEIGHT,
			margin = {top: 0, right: 20, bottom: 40, left: -40},
			titlepadding = 100,
			chartWidth = width + margin.left + margin.right,
			chartHeight= height + margin.top  + margin.bottom;
//		let g = rectSvg.append("g").attr("transform", "translate(" + (chartWidth + leftOffset) + "," + (HEIGHT + margin.top + topOffset) + ")"); // <---- This is where you play with it's position

		var color = d3.scaleOrdinal(["#5c0010", "#d28816", "#00CCCC"]);

		const yScale = d3.scaleLinear()
            .domain([0, 5000])
			.range([height, 0])
		const xScale = d3.scaleBand()
			.range([0,width])
			.domain(["Wine_PerCapita","Beer_PerCapita","Spirit_PerCapita"])
            .padding(0.1)

			rectSvg.append("text")
			.attr("x", chartWidth + leftOffset)
			.attr("y", HEIGHT + topOffset + titlepadding)
			.attr("text-anchor", "middle")
			.text(function(d) { return regionTitle; })
		rectSvg.selectAll()
			.data(data)
			.enter()
			.append("rect")
            .attr("x", d => ((chartWidth + leftOffset) - xScale(d.alcohol) ))

            .attr("y", d=> topOffset - yScale(d.consumption)+670)//has to be a function thing to get it up
            .attr("height", d => yScale(d.consumption))
            .attr("width", xScale.bandwidth())
			.attr("fill", function(d) { return color(d.alcohol)})

	}
}


