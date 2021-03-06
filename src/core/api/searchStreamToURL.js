import stringify from 'json-stable-stringify';
import { removeUndefined, validate, btoa } from '../../utils/index';

/**
 * Webhook Service
 * @param {Object} args
 * @param {String} args.type
 * @param {Object} args.body
 * @param {Object} webhook
 * @param {Function} onData
 * @param {Function} onError
 * @param {Function} onClose
 */
function searchStreamToURLApi(args, webhook, ...rest) {
  const parsedArgs = removeUndefined(args);
  let bodyCopy = parsedArgs.body;
  let type;
  let typeString;
  // Validate arguments
  let valid = validate(parsedArgs, {
    body: 'object',
  });
  if (valid !== true) {
    throw valid;
  }

  if (
    parsedArgs.type === undefined
    || !(typeof parsedArgs.type === 'string' || Array.isArray(parsedArgs.type))
    || (parsedArgs.type === '' || parsedArgs.type.length === 0)
  ) {
    throw new Error('fields missing: type');
  }

  valid = validate(parsedArgs.body, {
    query: 'object',
  });
  if (valid !== true) {
    throw valid;
  }

  if (Array.isArray(parsedArgs.type)) {
    ({ type } = parsedArgs);
    typeString = parsedArgs.type.join();
  } else {
    type = [parsedArgs.type];
    typeString = parsedArgs.type;
  }

  let webhooks = [];
  const { query } = bodyCopy;

  if (typeof webhook === 'string') {
    const webHookObj = {};
    webHookObj.url = webhook;
    webHookObj.method = 'GET';
    webhooks.push(webHookObj);
  } else if (webhook.constructor === Array) {
    webhooks = webhook;
  } else if (webhook === Object(webhook)) {
    webhooks.push(webhook);
  } else {
    throw new Error('fields missing: second argument(webhook) is necessary');
  }

  const populateBody = () => {
    bodyCopy = {};
    bodyCopy.webhooks = webhooks;
    bodyCopy.query = query;
    bodyCopy.type = type;
  };

  populateBody();

  const encode64 = btoa(stringify(query));
  const path = `.percolator/webhooks-0-${typeString}-0-${encode64}`;

  this.change = () => {
    webhooks = [];

    if (typeof parsedArgs === 'string') {
      const webhook2 = {};
      webhook2.url = parsedArgs;
      webhook2.method = 'POST';
      webhooks.push(webhook2);
    } else if (parsedArgs.constructor === Array) {
      webhooks = parsedArgs;
    } else if (parsedArgs === Object(parsedArgs)) {
      webhooks.push(parsedArgs);
    } else {
      throw new Error('fields missing: one of webhook or url fields is required');
    }

    populateBody();

    return this.performRequest('POST');
  };
  this.stop = () => {
    bodyCopy = undefined;
    return this.performRequest('DELETE');
  };
  this.performRequest = (method) => {
    const res = this.performWsRequest(
      {
        method,
        path,
        body: bodyCopy,
      },
      ...rest,
    );

    res.change = this.change;
    res.stop = this.stop;

    return res;
  };
  return this.performRequest('POST');
}
export default searchStreamToURLApi;
