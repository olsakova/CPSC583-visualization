/*
	With reference to: https://bost.ocks.org/mike/map/

*/

window.onload = function(){
    makeCharts();
};


const WIDTH = 850;
const HEIGHT = 600;
const MARGINS = {top: 0, bottom: 0, left: 0, right: 100};
let minHappiness;
let maxHappiness;

function makeCharts(){
    //Get the data
    d3.csv("HappinessAlcoholConsumption.csv").then(useTheData)

    // Use the data!
    function useTheData(data) {
		let mapSvg = d3.select('#map')
					.attr('width', WIDTH + MARGINS.left + MARGINS.right)
					.attr('height', HEIGHT + MARGINS.top + MARGINS.bottom);
		
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
			
			//Draw map background
			mapSvg.append('rect')
				.attr('width', WIDTH)
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
					}
				})
				.on('mouseout', function(d){
					div.style("opacity", 0)
				});
		
		
			
			let mapLegendLinearScale = d3.scaleLinear()
										.domain([minHappiness, maxHappiness])
										.range([HEIGHT - 20, 20]);
			
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
			
			mapSvg.selectAll('text.legend')
				.data(colorScale.nice().ticks(10))
				.enter()
				.append('text')
				.attr('class', 'legend')
				.attr('x', WIDTH + 15)
				.attr('y', (d) => {return mapLegendLinearScale(d);})
				.style('text-anchor', 'start')
				.text((d) => {return d;});
			
			mapSvg.append('text')
				.attr('class', 'legend-label')
				.attr('x', WIDTH + 50)
				.attr('y', HEIGHT / 2)
				.style('text-anchor', 'middle')
				.text('Happiness Score')
				.attr('transform', `rotate(90, ${WIDTH + 50}, ${HEIGHT/2})`)
			

			
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