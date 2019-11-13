/*
	With reference to: https://bost.ocks.org/mike/map/

*/

window.onload = function(){
    makeCharts();
};


const WIDTH = 850;
const HEIGHT = 600;
const MARGINS = {top: 0, bottom: 0, left: 0, right: 20};
let minHappiness;
let maxHappiness;

function makeCharts(){
    //Get the data
    d3.csv("HappinessAlcoholConsumption.csv").then(useTheData)

    // Use the data!
    function useTheData(data) {
		let mapSvg = d3.select('#map')
					.attr('width', WIDTH + MARGINS.left + MARGINS.right)
					.attr('height', HEIGHT + MARGINS.top + MARGINS.bottom)
					.style('background-color', 'cornflowerblue');					
		const projection = d3.geoMercator()
			.scale(130)
			.translate( [(WIDTH / 2), 400]);

		const path = d3.geoPath().projection(projection);
		
		minHappiness = d3.min(data, d => {return parseFloat(d.HappinessScore);});
		maxHappiness = d3.max(data, d => {return parseFloat(d.HappinessScore);});
		
		const colorScale = d3.scaleLinear()
			.domain([minHappiness, minHappiness + (maxHappiness - minHappiness)/2, maxHappiness])
			.range(["red", "orange", "cyan"]);

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
			
			mapSvg.append('g')
				.attr('class', 'countries')
				.selectAll('path')
				.data(map_data.features)
				.enter()
				.append('path')
				.attr('class', d => {return 'country-' + d.id;})
				.attr('d', path)
				.style('fill', d => {return d.happiness ? colorScale(parseFloat(d.happiness)) : 'white';})
				.style('opacity', d => {return d.happiness ? 1.0 : 0.5;})
				.style('stroke', 'black')
				.style('stroke-width', 0.3)
				.on('mouseover',function(d){
				
					if(d.happiness)
					{
						div.html('<span class="title">' + d.properties.name + "</span></br> Wine: " + d.wine +  "</br>Spirits: " + d.spirit + "</br> Beer: " +d.beer)
							.style("opacity", 1)
							.style("left", (d3.event.pageX) + "px")
							.style("top", (d3.event.pageY - 28) + "px");
					}
				})
				.on('mouseout', function(d){
					div.style("opacity", 0)
				});
		
		
			let mapLegendLinearScale = d3.scaleLinear()
										.domain([d3.min(data, d => {return d.HappinessScore;}), d3.max(data, d => {return d.HappinessScore;})])
										.range([HEIGHT, 0]);
			
			let legend = mapSvg.append('rect')
				.attr('x', WIDTH)
				.attr('width', 10)
				.attr('height', HEIGHT)
				.attr('class', 'legend')
				.attr('transform', `rotate(180, ${WIDTH + 10 / 2}, ${HEIGHT / 2})`) //Flip scale so Happy is on top
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
			
			
			

			
		});

	}
}

function generateListBetween(min, max, step)
{
	let out = [];
	let i = min;
	
	while(i <= max)
	{
		out.push(i);
		i += step;
	}
	
	return out;
}