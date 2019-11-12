window.onload = function(){
    makeCharts();
};


const WIDTH = 850;
const HEIGHT = 600;


function makeCharts(){
    //Get the data
    d3.csv("HappinessAlcoholConsumption.csv").then(useTheData)

    // Use the data!
    function useTheData(data) {
        
		let mapSvg = d3.select('#map')
					.attr('width', WIDTH)
					.attr('height', HEIGHT)
					.style('background-color', 'cornflowerblue');
					
		const projection = d3.geoMercator()
			.scale(130)
			.translate( [(WIDTH / 2), 400]);

		const path = d3.geoPath().projection(projection);
		
		const happinessScale = d3.scaleSequential(d3.interpolatePlasma)
								.domain([d3.min(data, d => {return d.HappinessScore;}), d3.max(data, d => {return d.HappinessScore;})]);
		
		let HACData = {};
		
		data.forEach(d => {
			//Special case remappings for countries that have different names between our data and the map data
			switch(d.Country)
			{
				case 'United States':
					HACData['USA'] = d;
					break;
				default:
				HACData[d.Country] = d;
				break;	
			}
			
		})
				
		d3.json('world_countries.json').then((map_data) => {
			map_data.features.forEach( d => d.happiness = (HACData[d.properties.name] || {HappinessScore: null}).HappinessScore);
			
			mapSvg.append('g')
				.attr('class', 'countries')
				.selectAll('path')
				.data(map_data.features)
				.enter()
				.append('path')
				.attr('class', d => {return 'country-' + d.id;})
				.attr('d', path)
				.style('fill', d => {return d.happiness ? happinessScale(d.happiness) : 'white';})
				.style('opacity', d => {return d.happiness ? 1.0 : 0.5;})
				.style('stroke', 'black')
				.style('stroke-width', 0.3)
			
			mapSvg.append('path')
				.datum(topojson.mesh(map_data.features, (a, b) => a.id !== b.id))
				.attr('class', 'names')
				.attr('d', path);
			
		});
		
		
		
		// Parse the data into usable format
		

        // Use that data to make the svg stuff
		
		
    }
}