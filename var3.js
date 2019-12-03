/*
	With reference to: https://bost.ocks.org/mike/map/

*/

window.onload = function () {
    makeCharts();
};


const MAP_WIDTH = 1000;
const SIDE_WIDTH = 260;
const HEIGHT = 600;
const MARGINS = {top: 0, bottom: 500, left: 0, right: 0};
const DONUTWIDTH = 160;
const DONUTHEIGHT = 160;
const ROSEWIDTH = 500;
const ROSEHEIGHT = 450;

let ext_svg = {};
var showWine = true;
var showBeer = true;
var showSpirits = true;

function makeCharts() {
    //Get the data
    d3.csv("HappinessAlcoholConsumption.csv").then(useTheData)

    // Use the data!
    function useTheData(data) {
        let mapSvg = d3.select('#map')
            .attr('width', MAP_WIDTH + MARGINS.left + MARGINS.right + SIDE_WIDTH)
            .attr('height', HEIGHT + MARGINS.top + MARGINS.bottom);

		//position map with translate
        const projection = d3.geoMercator()
            .scale(130)
            .translate( [MARGINS.left + (MAP_WIDTH / 2), 400]);

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
            .domain([minMaxHappiness.min, minMaxHappiness.min + (minMaxHappiness.max - minMaxHappiness.min) / 2, minMaxHappiness.max])
            .range(["#f7fcb9", "#addd8e", "#31a354"]); //Color scheme is colorblind safe according to colorbrewer
		
        //Add a background behind the glasses
        mapSvg.append('rect')
            .attr('y', 0)
            .attr('x', MAP_WIDTH + MARGINS.left)
            .attr('height', HEIGHT)
            .attr('width', MARGINS.right + SIDE_WIDTH)
            .style('fill', "#DDD");

        //Calculate avg for world summary
        let avgWine = d3.mean(data, d => {return d.Wine_PerCapita; });
        let avgBeer = d3.mean(data, d => {return d.Beer_PerCapita; });
        let avgSpirits = d3.mean(data, d => {return d.Spirit_PerCapita; });
        let avgHappiness = d3.mean(data, d => {return d.HappinessScore;});
		
		generateWineGlass([minMaxWine.min, minMaxWine.max]).then(() => {updateGlassFill(ext_svg.wineGlass, avgWine, avgWine.toFixed(2));});
		generateBeerGlass([minMaxBeer.min, minMaxBeer.max]).then(() => {updateGlassFill(ext_svg.beerGlass, avgBeer, avgBeer.toFixed(2));});
		generateMartiniGlass([minMaxSpirits.min,minMaxSpirits.max]).then(() => {updateGlassFill(ext_svg.martiniGlass, avgSpirits, avgSpirits.toFixed(2));});
		generateSmile([minMaxHappiness.min, 10]).then(() => {
			updateGlassFill(ext_svg.smile, avgHappiness, avgHappiness.toFixed(2) +'/10');
			ext_svg.smile.fill.style('fill', colorScale(avgHappiness));
		});

		//Set up labels for glasses
		
        mapSvg.append('text')
			.attr('class', 'glasses')
            .attr('x', MAP_WIDTH + MARGINS.right + 100 + 25)
            .attr('y', 20)
            .style('text-anchor', 'middle')
            .text('Global Average');
				
        mapSvg.append('text')
            .attr('x', MAP_WIDTH + MARGINS.right + 100 + 25)
            .attr('y', 35)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('(litres per capita per year)');


        let HACData = {};

        data.forEach(d => {
            //Special case remappings for countries that have different names between our data and the map data
            switch (d.Country) {
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

        });

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        d3.json('world_countries.json').then((map_data) => {
            map_data.features.forEach(d => {
                d.happiness = (HACData[d.properties.name] || {HappinessScore: null}).HappinessScore
                d.beer = (HACData[d.properties.name] || {Beer_PerCapita: null}).Beer_PerCapita
                d.spirit = (HACData[d.properties.name] || {Spirit_PerCapita: null}).Spirit_PerCapita
                d.wine = (HACData[d.properties.name] || {Wine_PerCapita: null}).Wine_PerCapita
            });

            //Draw map background
            mapSvg.append('rect')
                .attr('width', MAP_WIDTH + MARGINS.left)
                .attr('height', HEIGHT)
                .style('fill', '#71A6D2')
				.on('click', function() {
					
					//Update label
					mapSvg.selectAll('text.glasses').text("Global Average");
				
					//Set glass fill values
					updateGlassFill(ext_svg.wineGlass, avgWine, avgWine.toFixed(2));
					updateGlassFill(ext_svg.beerGlass, avgBeer, avgBeer.toFixed(2));
					updateGlassFill(ext_svg.martiniGlass, avgSpirits, avgSpirits.toFixed(2));
					updateGlassFill(ext_svg.smile, avgHappiness, avgHappiness.toFixed(2) +'/10');
					ext_svg.smile.fill.style('fill', colorScale(avgHappiness));
			});

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
				.style('cursor', (d) => {return (d.happiness) ? "pointer" : 'default'})
                //Tooltips!
                .on('mousemove', function (d) {

                    if (d.happiness)
                    {
                        div.html('<span class="title">' + d.properties.name + "</span></br> Wine: " + d.wine + "</br>Spirits: " + d.spirit + "</br> Beer: " + d.beer)
                            .style("opacity", 1)
                            .style("left", (d3.event.pageX) - div.node().clientWidth / 2 + "px")
                            .style("top", (d3.event.pageY - div.node().clientHeight - 10) + "px");
                    }
                })
                .on('mouseout', function (d) {
                    div.style("opacity", 0)
                })
				.on('click', function(d){
					
					if(d.happiness){
						//Update label
						mapSvg.selectAll('text.glasses').text( d.id == 'COD' ? 'Dem. Rep. of the Congo' : d.id == 'COG' ? 'Rep. of the Congo'  :  d.properties.name + " Consumption");

						//Update glassses fill levels
						updateGlassFill(ext_svg.wineGlass, d.wine, parseFloat(d.wine).toFixed(2));
						updateGlassFill(ext_svg.beerGlass, d.beer, parseFloat(d.beer).toFixed(2));
						updateGlassFill(ext_svg.martiniGlass, d.spirit, parseFloat(d.spirit).toFixed(2));
						updateGlassFill(ext_svg.smile, d.happiness, parseFloat(d.happiness).toFixed(2) +'/10');
						ext_svg.smile.fill.style('fill', colorScale(parseFloat(d.happiness)));
					}
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
                .attr('transform', `rotate(180, ${MAP_WIDTH + 10 / 2}, ${HEIGHT / 2}),translate(${MAP_WIDTH}, 0)`) //Flip scale so Happy is on top
                .attr('fill', 'url("#gradient")');

            //Build Gradient
            /*
                References: https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient.html
            */

            let defs = mapSvg.append('defs');
            let linearGradient = defs.append("linearGradient")
                                    .attr("id", "gradient")
                                    .attr('gradientTransform', 'rotate(90)');
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
                .attr('x', 15)
                .attr('y', (d) => {return mapLegendLinearScale(d);})
                .style('text-anchor', 'start')
                .text((d) => {return d;});

            //Legend label
            legend.append('text')
                .attr('class', 'legend-label')
                .attr('x', 70)
                .attr('y', HEIGHT / 2)
                .style('text-anchor', 'middle')
                .text('Happiness Score')
                .attr('transform', `rotate(90, ${70}, ${HEIGHT / 2})`);

            legend.append('text')
                .attr('class', 'legend-label')
                .attr('x', 50)
                .attr('y', HEIGHT - 10)
                .style('text-anchor', 'start')
                .text('Unhappy');

            legend.append('text')
                .attr('class', 'legend-label')
                .attr('x', 50)
                .attr('y', 20)
                .style('text-anchor', 'start')
                .text('Happy');

            //Prepare Country Abbreviations using the world map data to use in the rose charts
            let countryAbbr = [];
            map_data.features.forEach(c => {
                switch(c.Country)
                {
                    case "Cote d'Ivoire":
                        countryAbbr['Ivory Coast'] = c.id;
                        break;
                    case "Dem. Rep. Congo":
                        countryAbbr['Democratic Republic of the Congo'] = c.id;
                        break;
                    case "Rep. Congo":
                        countryAbbr['Republic of the Congo'] = c.id;
                        break;
                    case "Russian Federation":
                        countryAbbr['Russia'] = c.id;
                        break;
                    case 'United Kingdom':
                        countryAbbr['England'] = c.id;
                        break;
                    case 'United States':
                        countryAbbr['USA'] = c.id;
                        break;
                    default:
                        countryAbbr[c.properties.name] = c.id;
                        break;
                }
            });

            //Add missing abbreviations
            countryAbbr['Comoros'] = 'COM';
            countryAbbr["Cote d'Ivoire"] = 'CIV';
            countryAbbr["Rep. Congo"] = 'COG';
            countryAbbr["Dem. Rep. Congo"] = 'COD';
            countryAbbr["Dem. Rep. Congo"] = 'COD';
            countryAbbr["Mauritius"] = 'MUS';
            countryAbbr["Tanzania"] = 'TZA';
            countryAbbr["Russian Federation"] = 'RUS';
            countryAbbr["Serbia"] = 'SRB';
            countryAbbr["United Kingdom"] = 'GBR';
            countryAbbr["Malta"] = 'MLT';
            countryAbbr["Bahrain"] = 'BHR';
            countryAbbr["Singapore"] = 'SGP';
            countryAbbr["United States"] = 'USA';

            makeCharts(countryAbbr);

			//Draw colour legend for each alcohol type
            buildColourLegend();
			
        });

        // Functions for generating fillable glasses
        function updateGlassFill(glassData, fillAmount, label) {
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

        async function generateSmile(minmax) {
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

                ext_svg.smile = {
                    glass: glass,
                    scale: happinessScale,
                    fill: fill,
                    y: y,
                    maxHeight: maxHeight,
                    text: label
                };
            });
        }

        //Prepare data for donut and rose charts.
        //At the end of this function, the charts are called
        function makeCharts(countryAbbr) {
            // Combine data based on alcohol, because its not usable in its current format
            var regionsByAlcohol2 = d3.nest()
                .key(function (d) {
                    return d.Region;
                })
                .rollup(function (v) {
                    return {
                        Wine_PerCapita: d3.sum(v, function (d) {
                            return d.Wine_PerCapita;
                        }),
                        Beer_PerCapita: d3.sum(v, function (d) {
                            return d.Beer_PerCapita;
                        }),
                        Spirit_PerCapita: d3.sum(v, function (d) {
                            return d.Spirit_PerCapita;
                        })
                    };
                })
                .object(data);

            // use map to bring the arrays together
            var regionsByAlcohol3 = Object.keys(regionsByAlcohol2).map(function (key) {
                return [String(key), regionsByAlcohol2[key]];
            });

            // put into an array of arrays (because we got a bunch of object arrays that cant be stacked)
            var regionsByAlcohol4 = [];
            for (var i = 0; i < regionsByAlcohol3.length; i++) {
                var temp = {
                    Region: regionsByAlcohol3[i][0],
                    Wine_PerCapita: +regionsByAlcohol3[i][1].Wine_PerCapita,
                    Beer_PerCapita: +regionsByAlcohol3[i][1].Beer_PerCapita,
                    Spirit_PerCapita: +regionsByAlcohol3[i][1].Spirit_PerCapita
                };
                regionsByAlcohol4[i] = temp;
            }
            regionsByAlcohol4.columns = ["Region", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var countryAlcohol1 = d3.nest()
                .key(function (d) {
                    return d.Region;
                })
                .object(data);

            var countryAlcohol2 = Object.keys(countryAlcohol1).map(function (key) {
                return [String(key), countryAlcohol1[key]];
            });


            //Reformat data for each region
            var easternEurope = countryAlcohol2[0][1];
            var easternEurope2 = [];
            for (var i = 0; i < easternEurope.length; i++) {
                var temp = {
                    Country: countryAbbr[easternEurope[i].Country] || easternEurope[i].Country,
                    Wine_PerCapita: +easternEurope[i].Wine_PerCapita,
                    Beer_PerCapita: +easternEurope[i].Beer_PerCapita,
                    Spirit_PerCapita: +easternEurope[i].Spirit_PerCapita
                };
                easternEurope2[i] = temp;
            }
            easternEurope2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var subAfrica = countryAlcohol2[1][1];
            var subAfrica2 = [];
            for (var i = 0; i < subAfrica.length; i++) {
                var temp = {
                    Country: countryAbbr[subAfrica[i].Country] || subAfrica[i].Country,
                    Wine_PerCapita: +subAfrica[i].Wine_PerCapita,
                    Beer_PerCapita: +subAfrica[i].Beer_PerCapita,
                    Spirit_PerCapita: +subAfrica[i].Spirit_PerCapita
                };
                subAfrica2[i] = temp;
            }
            subAfrica2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var southAmerica = countryAlcohol2[2][1];
            var southAmerica2 = [];
            for (var i = 0; i < southAmerica.length; i++) {
                var temp = {
                    Country: countryAbbr[southAmerica[i].Country] || southAmerica[i].Country,
                    Wine_PerCapita: +southAmerica[i].Wine_PerCapita,
                    Beer_PerCapita: +southAmerica[i].Beer_PerCapita,
                    Spirit_PerCapita: +southAmerica[i].Spirit_PerCapita
                };
                southAmerica2[i] = temp;
            }
            southAmerica2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var aussie = countryAlcohol2[3][1];
            var aussie2 = [];
            for (var i = 0; i < aussie.length; i++) {
                var temp = {
                    Country: countryAbbr[aussie[i].Country] || aussie[i].Country,
                    Wine_PerCapita: +aussie[i].Wine_PerCapita,
                    Beer_PerCapita: +aussie[i].Beer_PerCapita,
                    Spirit_PerCapita: +aussie[i].Spirit_PerCapita
                };
                aussie2[i] = temp;
            }
            aussie2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var westernEurope = countryAlcohol2[4][1];
            var westernEurope2 = [];
            for (var i = 0; i < westernEurope.length; i++) {
                var temp = {
                    Country: countryAbbr[westernEurope[i].Country] || westernEurope[i].Country,
                    Wine_PerCapita: +westernEurope[i].Wine_PerCapita,
                    Beer_PerCapita: +westernEurope[i].Beer_PerCapita,
                    Spirit_PerCapita: +westernEurope[i].Spirit_PerCapita
                };
                westernEurope2[i] = temp;
            }
            westernEurope2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var middleEast = countryAlcohol2[5][1];
            var middleEast2 = [];
            for (var i = 0; i < middleEast.length; i++) {
                var temp = {
                    Country: countryAbbr[middleEast[i].Country] || middleEast[i].Country,
                    Wine_PerCapita: +middleEast[i].Wine_PerCapita,
                    Beer_PerCapita: +middleEast[i].Beer_PerCapita,
                    Spirit_PerCapita: +middleEast[i].Spirit_PerCapita
                };
                middleEast2[i] = temp;
            }
            middleEast2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var seAsia = countryAlcohol2[6][1];
            var seAsia2 = [];
            for (var i = 0; i < seAsia.length; i++) {
                var temp = {
                    Country: countryAbbr[seAsia[i].Country] || seAsia[i].Country,
                    Wine_PerCapita: +seAsia[i].Wine_PerCapita,
                    Beer_PerCapita: +seAsia[i].Beer_PerCapita,
                    Spirit_PerCapita: +seAsia[i].Spirit_PerCapita
                };
                seAsia2[i] = temp;
            }
            seAsia2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var northAmerica = countryAlcohol2[7][1];
            var northAmerica2 = [];
            for (var i = 0; i < northAmerica.length; i++) {
                var temp = {
                    Country: countryAbbr[northAmerica[i].Country] || northAmerica[i].Country,
                    Wine_PerCapita: +northAmerica[i].Wine_PerCapita,
                    Beer_PerCapita: +northAmerica[i].Beer_PerCapita,
                    Spirit_PerCapita: +northAmerica[i].Spirit_PerCapita
                };
                northAmerica2[i] = temp;
            }
            northAmerica2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]

            var eastAsia = countryAlcohol2[8][1];
            var eastAsia2 = [];
            for (var i = 0; i < eastAsia.length; i++) {
                var temp = {
                    Country: countryAbbr[eastAsia[i].Country] || eastAsia[i].Country,
                    Wine_PerCapita: +eastAsia[i].Wine_PerCapita,
                    Beer_PerCapita: +eastAsia[i].Beer_PerCapita,
                    Spirit_PerCapita: +eastAsia[i].Spirit_PerCapita
                };
                eastAsia2[i] = temp;
            }
            eastAsia2.columns = ["Country", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"]


            //An array which contains all arrays of region data, formatted appropriately for a rose chart.
            var allRegionsRoseFormat = [easternEurope2, subAfrica2, southAmerica2,
                aussie2, westernEurope2, middleEast2,
                seAsia2, northAmerica2, eastAsia2, countryAbbr];

            //Draw background behind donuts
            d3.select("svg").append('rect')
                .attr('y', HEIGHT)
                .attr('height', MARGINS.bottom)
                .attr('width', MAP_WIDTH + SIDE_WIDTH + MARGINS.left + MARGINS.right)
                .style('fill', "#CCC");
			
			//Draw colour legend for each alcohol type
            buildColourLegend();

            //Build all donut charts, and pass in data to be used for rose chart
            buildDonutCharts(data, regionsByAlcohol4, allRegionsRoseFormat);
        }
    }

    //Build all 9 donut charts, while also passing in parameters for each corresponding rose chart
    function buildDonutCharts(data, regionsArray, roseData){

        var donutData;

		donutData = constructDonutData(regionsArray, 7);
        donutChart(data, donutData, 0, 140, "North America", roseData[7], 600, roseData[9]);
		
		donutData = constructDonutData(regionsArray, 2);
        donutChart(data, donutData, 0, 360, "South America", roseData[2], 500, roseData[9]);
		
		donutData = constructDonutData(regionsArray, 4);
        donutChart(data, donutData, 252 * 1, 140, "Western Europe", roseData[4], 600, roseData[9]);
		
        donutData = constructDonutData(regionsArray, 0);
        donutChart(data, donutData, 252 * 1, 360, "Central & Eastern Europe", roseData[0], 800, roseData[9]);

		donutData = constructDonutData(regionsArray, 5);
        donutChart(data, donutData, 252 * 2, 140, "Middle East & North Africa", roseData[5], 200, roseData[9]);
		
        donutData = constructDonutData(regionsArray, 1);
        donutChart(data, donutData, 252 * 2, 360, "Sub-Saharan Africa", roseData[1], 500, roseData[9]);

        donutData = constructDonutData(regionsArray, 8);
        donutChart(data, donutData, 252 * 3, 140, "Eastern Asia", roseData[8], 500, roseData[9]);

		donutData = constructDonutData(regionsArray, 6);
        donutChart(data, donutData, 252 * 3, 360, "South East Asia", roseData[6], 400, roseData[9]);
		
        donutData = constructDonutData(regionsArray, 3);
        donutChart(data, donutData, 252 * 4, 360, "Australia & New Zealand", roseData[3], 600, roseData[9]);
		
		//Draw section label
		d3.select("svg").append('text')
			.attr('class', 'donut')
			.attr('y', HEIGHT + 25)
			.attr('x', (MAP_WIDTH + SIDE_WIDTH + MARGINS.left + MARGINS.right) / 2)
			.style('text-anchor', 'middle')
			.style('font-size', '20px')
			.text("Alcohol Consumption by Region");
    }

    // Format the data such that the donut code can make sense of it
    function constructDonutData(regionArray, regionIndex) {
        var donutData = [{
            alcohol: (d3.keys(regionArray[regionIndex])[1]),
            consumption: (d3.values(regionArray[regionIndex])[1])
        },
            {alcohol: (d3.keys(regionArray[regionIndex])[2]), consumption: (d3.values(regionArray[regionIndex])[2])},
            {alcohol: (d3.keys(regionArray[regionIndex])[3]), consumption: (d3.values(regionArray[regionIndex])[3])}
        ];
        return donutData;
    }

    /*
        BUILD INDIVIDUAL DONUT CHART FOR A PARTICULAR REGION
        based on pie chart example: https://scrimba.com/p/pPrZLhD/c6ZPkH3
    */

    function donutChart(dataset, customizedData, leftOffset, topOffset, regionTitle, roseData, roseMax, abbr) {

        //Set the data
        var data = customizedData;

        var totalRegionConsumption = d3.sum(data, function(d){return d.consumption});

        console.log("TOTAL CONSUMPTION FOR", regionTitle + ":", totalRegionConsumption);       //TESTING

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //Set all initial variables
        var donutSvg = d3.select("svg"),
            width = DONUTWIDTH,
            height = DONUTHEIGHT,
            margin = {top: 0, right: 20, bottom: 40, left: -50},
            titlepadding = 100,
            chartWidth = width + margin.left + margin.right,
            chartHeight = height + margin.top + margin.bottom;

        var radius = 85;
        var color = d3.scaleOrdinal(["#5c0010", "#d28816", "#00CCCC"]);

        //Build donut chart svg
        let g = donutSvg.append("g")
			.attr('class', 'donut')
		.attr("transform", "translate(" + (chartWidth + leftOffset) + "," + (HEIGHT + margin.top + topOffset) + ")"); // <---- This is where you play with it's position

        var donut = d3.pie().value(function (d) {
            return d.consumption;
        });

        var path = d3.arc()
            .outerRadius(radius)
            .innerRadius(30);

        var arc = g.selectAll()
            .data(donut(data))
            .enter()
            .append("g");

        arc.append("path")
            .attr("d", path)
            .attr("fill", function (d) {
                return color(d.data.consumption);
            })

        //Tooltips!
        .on('mousemove', function (d) {
            var alcoholType = "";
            var consumptionPercent;

            //Print alcohol type nicely
            if (d.data.alcohol == "Wine_PerCapita"){alcoholType = "Wine: ";}
            if (d.data.alcohol == "Beer_PerCapita"){alcoholType = "Beer: ";}
            if (d.data.alcohol == "Spirit_PerCapita"){alcoholType = "Spirits: ";}

            //Calculate and format percentage
            consumptionPercent = (d.data.consumption/totalRegionConsumption *100).toFixed(2);

            //Make Tooltip
            div.html('<span class="title">' + regionTitle + "<br>" + (alcoholType) + (consumptionPercent) + "% <br>" + (d.data.consumption) + " L per capita")
                .style("opacity", 1)
                .style("left", (d3.event.pageX) - div.node().clientWidth / 2 + "px")
                .style("top", (d3.event.pageY - div.node().clientHeight - 10) + "px");

        })
        .on('mouseout', function (d) {
            div.style("opacity", 0)
        });

        //Add label under chart with with region name
        donutSvg.append("text")
			.attr('class', 'donut')
            .attr("x", chartWidth + leftOffset)
            .attr("y", HEIGHT + topOffset + titlepadding)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return regionTitle;
            });

        //INTERACTION!
        g.style('cursor', 'pointer')
			.on("click", function () {

            // Hide the donuts
			donutSvg.selectAll('.donut').attr('display', 'none');
			donutSvg.selectAll('.chartLegend').attr('display', 'none');
			//Draw the rose chart
            roseChart(dataset, regionTitle, roseData, roseMax, abbr);
        });
    }


/*
       BUILD ROSE CHART CORRESPONDING TO THE CLICKED DONUT CHART
*/

    function roseChart(dataset, title, customizedData, maxAmount, abbr) {
        buildRose(dataset, title, customizedData, customizedData, maxAmount, abbr);

		//Build the home button which always bring user back to all donut charts
		buildDonutsButton();

		//add the filters
        buildFilters(dataset, title, customizedData, maxAmount, abbr);
    }

    function buildRose(dataset, title, customizedData, filteredData, maxAmount, abbr) {
        if (!showWine || !showBeer || !showSpirits){
            customizedData = filteredData;
        }
				
        // Set div for tool tip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //Set initial variables
        var roseSvg = d3.select("svg"),
            width = ROSEWIDTH,
            height = ROSEHEIGHT,
            leftOffset = 450,
            topOffset = 200,
            margin = {top: 40, right: 20, bottom: 40, left: 20},
            innerRadius = 30,
            chartWidth = width - margin.left - margin.right,
            chartHeight = height - margin.top - margin.bottom,
            outerRadius = (Math.min(chartWidth, chartHeight) / 2);

        // Build Rose SVG
        let g = roseSvg.append("g")
            .attr('class', 'rose')
            .attr("transform", "translate(" + (chartWidth / 2 + leftOffset) + "," + (HEIGHT + margin.top + topOffset) + ")"); // <---- This is where you play with it's position

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
            .range(["#5c0010", "#d28816", "#00DDDD"]);

        //Rose chart code
        for (i = 6, t = 0; i < customizedData.columns.length; ++i) {
            t += customizedData[customizedData.columns[i]] = +customizedData[customizedData.columns[i]];
        }

        customizedData.total = t;

        x.domain(customizedData.map(function (d) {
            return d.Country;
        }));
        y.domain([0, maxAmount]);
        z.domain(customizedData.columns.slice(1));

        // Extend the domain slightly to match the range of [0, 2π].
        angle.domain([0, d3.max(customizedData, function (d, i) {
            return i + 1;
        })]);
        radius.domain([0, d3.max(customizedData, function (d) {
            return d.y0 + d.y;
        })]);
        angleOffset = -360.0 / customizedData.length / 2.0;

        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(customizedData.columns.slice(1))(customizedData))
            .enter().append("g")
            .attr("fill", function (d) {
                return z(d.key);
            })
            .selectAll("path")
            .data(function (d) {
                return d;
            })
            .enter().append("path")
            .attr("d", d3.arc()
                .innerRadius(function (d) {
                    return y(d[0]);
                })
                .outerRadius(function (d) {
                    return y(d[1]);
                })
                .startAngle(function (d) {
                    return x(d.data.Country);
                })
                .endAngle(function (d) {
                    return x(d.data.Country) + x.bandwidth();
                })
                .padAngle(0.01)
                .padRadius(innerRadius))
            .attr("transform", function () {
                return "rotate(" + angleOffset + ")"
            })

            //Tooltips!
            .on('mousemove', function (d) {
                div.html('<span class="title">' + (getKeyByValue(abbr, d.data.Country)) + "</span>" + (d.data.Wine_PerCapita ? "</br> Wine: " + d.data.Wine_PerCapita : '') + (d.data.Spirit_PerCapita ? "</br>Spirits: " + d.data.Spirit_PerCapita : '' ) + (d.data.Beer_PerCapita ? "</br> Beer: " + d.data.Beer_PerCapita : ''))
                    .style("opacity", 1)
                    .style("left", (d3.event.pageX) - div.node().clientWidth / 2 + "px")
                    .style("top", (d3.event.pageY - div.node().clientHeight - 10) + "px");
            })

            .on('mouseout', function (d) {
                div.style("opacity", 0)
            });

        g.append('text')
            .attr('x', (-ROSEWIDTH) + 35)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', 30)
            .text(title);

        var label = g.append("g")
            .selectAll("g")
            .data(customizedData)
            .enter().append("g")
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
                return "rotate(" + ((x(d.Country) + x.bandwidth() / 2) * 180 / Math.PI - (90 - angleOffset)) + ")translate(" + (outerRadius + 30) + ",0)";
            });

        label.append("text")
            .attr("transform", function (d) {
                return (x(d.Country) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) <= Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
            })
            .text(function (d) {
                return d.Country;
            })
            .style("font-size", 12);

        var yAxis = g.append("g")
            .attr("text-anchor", "middle");

        var yTick = yAxis
            .selectAll("g")
            .data(y.ticks(3).slice(1))
            .enter().append("g");

        yTick.append("circle")
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4,4")
            .attr("r", y);

        yTick.append("text")
            .attr("y", function (d) {
                return -y(d) + 2;
            })
            .attr("dy", "-0.35em")
            .attr("x", 0)
            .text(y.tickFormat(5, "s"))
            .style("font-size", 12);
    }

    // BUILD FILTERS
    function buildFilters(dataset, title, oldData, maxAmount, abbr) {
        var wineSvg = d3.select("svg");
        var beerSvg = d3.select("svg");
        var spiritSvg = d3.select("svg");

        //Wine legend item
        wineSvg.append("rect")
            .attr('class', 'wineButton')
            .style('cursor', 'pointer')
            .attr('width', 150)
            .attr('height', 40)
            .attr('x', 120)
            .attr('y', HEIGHT + MARGINS.bottom - 135)
            .attr('rx', 10)
            .attr('ry', 10)
            .style("fill", "#5c0010")
            .attr('fill-opacity', '1.0')
            .on('click', function() {
                filter(wineSvg,true, false, false, oldData, dataset, title, maxAmount, abbr);
                let button = d3.select(this);
                if(button.style("fill-opacity") === '1'){
                    button.style("fill-opacity", 0.2);
                }
                else {
                    button.style("fill-opacity", 1.0);
                }
            });
        wineSvg.append('g')
            .attr('class', 'wineButton')
            .style("pointer-events", "none")
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('width', 100)
            .attr('height', 25)
            .attr('x', 190)
            .attr('y', HEIGHT + MARGINS.bottom - 107)
            .text('WINE')
            .style('fill', 'white')
            .style('font-size', '24px');

        beerSvg.append("rect")
            .attr('class', 'beerButton')
            .style('cursor', 'pointer')
            .attr('width', 150)
            .attr('height', 40)
            .attr('x', 120)
            .attr('y', HEIGHT + MARGINS.bottom - 185)
            .attr('rx', 10)
            .attr('ry', 10)
            .style("fill", "#d28816")
            .attr('fill-opacity', '1.0')
            .on('click', function()
            {
                filter(beerSvg,false, true, false, oldData, dataset, title, maxAmount, abbr);
                let button = d3.select(this);
                if(button.style("fill-opacity") === '1'){
                    button.style("fill-opacity", 0.2);
                }
                else {
                    button.style("fill-opacity", 1.0);
                }
            });
        beerSvg.append('g')
            .attr('class', 'beerButton')
            .style("pointer-events", "none")
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('width', 100)
            .attr('height', 25)
            .attr('x', 195)
            .attr('y', HEIGHT + MARGINS.bottom - 157)
            .text('BEER')
            .style('fill', 'black')
            .style('font-size', '24px');

        spiritSvg.append("rect")
            .attr('class', 'spiritButton')
            .style('cursor', 'pointer')
            .attr('width', 150)
            .attr('height', 40)
            .attr('x', 120)
            .attr('y', HEIGHT + MARGINS.bottom - 235)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill-opacity', '1.0')
            .style("fill", "#00CCCC")
            .on('click', function()
            {
                filter(spiritSvg,false, false, true, oldData, dataset, title, maxAmount, abbr);
                let button = d3.select(this);
                if(button.style("fill-opacity") === '1'){
                    button.style("fill-opacity", 0.2);
                }
                else {
                    button.style("fill-opacity", 1.0);
                }
            });
        spiritSvg.append('g')
            .attr('class', 'spiritButton')
            .style("pointer-events", "none")
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('width', 100)
            .attr('height', 25)
            .attr('x', 195)
            .attr('y', HEIGHT + MARGINS.bottom - 207)
            .text('SPIRITS')
            .style('fill', 'black')
            .style('font-size', '24px');
    }

    function filter(svg, wineClicked, beerClicked, spiritClicked, oldData, dataset, title, maxAmount, abbr){
        var newData = oldData.map(item => ({...item}));
        newData.columns = ["Region", "Wine_PerCapita", "Beer_PerCapita", "Spirit_PerCapita"];

        //Toggle on and off the alcohol
        if(wineClicked){
            showWine = !showWine;
        }
        else if(beerClicked){
            showBeer = !showBeer;
        }
        else if(spiritClicked){
            showSpirits = !showSpirits;
        }

        //Update the data based on whats toggled
        if(!showWine){
            for(i = 0; i < newData.length; i++){
                newData[i].Wine_PerCapita = 0
            }
        }
        if (!showBeer) {
            for(i = 0; i < newData.length; i++){
                newData[i].Beer_PerCapita = 0
            }
        }
        if (!showSpirits) {
            for(i = 0; i < newData.length; i++){
                newData[i].Spirit_PerCapita = 0
            }
        }
        //Remove the rose
        svg.selectAll('.rose').remove();
        //Rebuild the rose
        buildRose(dataset, title, oldData, newData, maxAmount, abbr)
    }

/*
        BUILD COLOUR LEGEND
*/

    function buildColourLegend() {

        var legendSvg = d3.select("svg");
        var legendX = MAP_WIDTH + 35;
        var legendY = HEIGHT + 140 - DONUTHEIGHT / 2;

        //Wine legend item
        legendSvg.append("rect")
            .attr('class', 'chartLegend')
            .attr("width", 30)
            .attr("height", 30)
            .attr("x", legendX)
            .attr("y", legendY)
            .attr('rx', 10)
            .attr('ry', 10)
            .style("fill", "#5c0010");
        legendSvg.append("text")
            .attr('class', 'chartLegend')
            .attr("x", legendX + 40)
            .attr("y", legendY + 15)
            .attr("dy", ".35em")
            .text("Wine Consumption");

        //Beer legend item
        legendSvg.append("rect")
            .attr('class', 'chartLegend')
            .attr("width", 30)
            .attr("height", 30)
            .attr("x", legendX)
            .attr("y", legendY + 60)
            .attr('rx', 10)
            .attr('ry', 10)
            .style("fill", "#d28816");

        legendSvg.append("text")
            .attr('class', 'chartLegend')
            .attr("x", legendX + 40)
            .attr("y", legendY + 75)
            .attr("dy", ".35em")
            .text("Beer Consumption");

        //Spirits legend item
        legendSvg.append("rect")
            .attr('class', 'chartLegend')
            .attr("width", 30)
            .attr("height", 30)
            .attr("x", legendX)
            .attr("y", legendY + 120)
            .attr('rx', 10)
            .attr('ry', 10)
            .style("fill", "#00CCCC");

        legendSvg.append("text")
            .attr('class', 'chartLegend')
            .attr("x", legendX + 40)
            .attr("y", legendY + 135)
            .attr("dy", ".35em")
            .text("Spirits Consumption");
    }

    //BUILD DONUTS BUTTON
    function buildDonutsButton() {

        //Donuts button SVG: a grey tab above the charts
        var donutButtonSvg = d3.select("svg");

		donutButtonSvg
			.append('g')
			.attr('class', 'returnbtn')
			.on('click', function()
		   	{
				//Remove the button
				donutButtonSvg.selectAll('g.returnbtn').remove();

				//Remove the wine filter
                donutButtonSvg.selectAll('g.wineButton').remove();
                donutButtonSvg.selectAll('g.spiritButton').remove();
                donutButtonSvg.selectAll('g.beerButton').remove();
                donutButtonSvg.selectAll('rect.wineButton').remove();
                donutButtonSvg.selectAll('rect.spiritButton').remove();
                donutButtonSvg.selectAll('rect.beerButton').remove();
                showWine = true;
                showBeer = true;
                showSpirits = true;

                //Remove the rose
				donutButtonSvg.selectAll('.rose').remove();
			
				//Show the donuts
				donutButtonSvg.selectAll('.donut').attr('display', 'true');
                donutButtonSvg.selectAll('.chartLegend').attr('display', 'true');
			
			})
			.style('cursor', 'pointer')
			.append('text')
			.attr('width', 100)
			.attr('height', 25)
			.attr('x', 25)
			.attr('y', HEIGHT + MARGINS.bottom - 25)
			.text('← regions')
			.style('fill', 'black')
			.style('font-size', '18px');
		
     }
	
	// Src: https://stackoverflow.com/a/28191966
	function getKeyByValue(object, value) {
	  return Object.keys(object).find(key => object[key] === value);
	}
}

