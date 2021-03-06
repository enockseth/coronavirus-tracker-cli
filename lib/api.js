const NodeCache = require('node-cache');
const axios = require('axios');
const { countryNameMap } = require('./constants');

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 600 });

exports.getCoronaData = async () => {
  const CORONA_ALL_KEY = 'coronaAll';
  const cache = myCache.get(CORONA_ALL_KEY);

  if (cache) {
    return cache;
  }
  const result = await axios('https://coronavirus-tracker-api.herokuapp.com/all');

  if (!result || !result.data) {
    throw new Error('Source API failure.');
  }
  myCache.set(CORONA_ALL_KEY, result.data, 60 * 15);
  return result.data;
};

/** Fetch Worldometers Data */
exports.getWorldoMetersData = async (countryCode = 'ALL') => {
  const key = `worldMetersData_${countryCode}`;
  const cache = myCache.get(key);

  if (cache) {
    console.log('cache', key);
    return cache;
  }
  const result = await axios('https://corona.lmao.ninja/countries');
  if (!result || !result.data) {
    throw new Error('WorldoMeters Source API failure');
  }

  const worldStats = result.data.reduce((acc, countryObj) => {
    acc.cases += countryObj.cases;
    acc.todayCases += countryObj.todayCases;
    acc.deaths += countryObj.deaths;
    acc.todayDeaths += countryObj.todayDeaths;
    acc.recovered += countryObj.recovered;
    acc.active += countryObj.active;
    acc.critical += countryObj.critical;
    return acc;
  }, {
    countryName: 'World',
    cases: 0,
    todayCases: 0,
    deaths: 0,
    todayDeaths: 0,
    recovered: 0,
    active: 0,
    critical: 0,
  });

  result.data.forEach(obj => obj.countryCode = countryNameMap[obj.country]);
  worldStats.casesPerOneMillion = (worldStats.cases / 7794).toFixed(2);
  let finalData =  result.data;
  console.log(countryCode);
  if (countryCode && countryCode !== 'ALL') {
    finalData = finalData.filter(obj => obj.countryCode === countryCode);
  }
  const returnObj = { data: finalData, worldStats };

  myCache.set(key, returnObj, 60 * 15);
  return returnObj;
};
