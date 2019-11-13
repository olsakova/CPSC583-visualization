/*
	With reference to: https://bost.ocks.org/mike/map/

*/

window.onload = function(){
    makeCharts();
};


const MAP_WIDTH = 850;
const SIDE_WIDTH = 400;
const HEIGHT = 600;
const MARGINS = {top: 0, bottom: 0, left: 0, right: 150};
//let minHappiness;
//let maxHappiness;

let ext_svg = {};


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
		
	}
}

