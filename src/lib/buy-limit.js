const request = require('request');
const config = require('config');
const crypto = require('crypto');
const qs = require('querystring');

const buyLimit = (market, quantity, rate) => new Promise(
  async (resolveBuyLimit, rejectBuyLimit) => {
    const query = {
      apikey: config.get('bittrexApiKey'),
      nonce: new Date().getTime(),
      market,
      quantity,
      rate,
    };

    const url = `${config.get('bittrex.buylimiturl')}?${qs.stringify(query)}`;
    const apisign = crypto.createHmac('sha512', config.get('bittrexApiSecret')).update(url).digest('hex');

    try {
      const order = await (
        new Promise((resolve, reject) => request({ url, headers: { apisign } },
          (error, response) => {
            if (error) {
              return reject(error);
            }

            if (response.body === undefined) {
              return reject(new Error('Empty body'));
            }

            let jsonBody;
            try {
              jsonBody = JSON.parse(response.body);
            } catch (jsonParseError) {
              return reject(jsonParseError);
            }

            if (jsonBody.success !== true) {
              return reject(new Error(jsonBody.message || 'Unknown error'));
            }

            return resolve(jsonBody.result);
          })));

      return resolveBuyLimit(order);
    } catch (error) {
      return rejectBuyLimit(error);
    }
  });

module.exports = buyLimit;
