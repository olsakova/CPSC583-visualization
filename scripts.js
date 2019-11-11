window.onload = function(){
    makeCharts();
};

function makeCharts(){
    //Get the data
    d3.csv("HappinessAlcoholConsumption.csv").then(useTheData)

    // Use the data!
    function useTheData(data) {
        console.log(data);
        // Parse the data into usable format

        // Use that data to make the svg stuff
    }
}