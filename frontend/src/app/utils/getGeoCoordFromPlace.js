import axios from "axios";
export async function getCoords(city, state, country) {
    
    try {
        const res = await axios.get(`http://api.openweathermap.co.uk/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid=c40899c123477eec1b06529158b4f0c9`)
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }

}