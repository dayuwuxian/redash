import moment from 'moment';
import isString from 'underscore';

export default function formatValue($filter, clientConfig, value, type) {
  let formattedValue = value;
  switch (type) {
    case 'integer':
      formattedValue = $filter('number')(value, 0);
      break;
    case 'float':
      formattedValue = $filter('number')(value, 2);
      break;
    case 'boolean':
      if (value !== undefined) {
        formattedValue = String(value);
      }
      break;
    case 'date':
      if (value && moment.isMoment(value)) {
        formattedValue = value.format(clientConfig.dateFormat);
      }
      break;
    case 'datetime':
      if (value && moment.isMoment(value)) {
        formattedValue = value.format(clientConfig.dateTimeFormat);
      }
      break;
    default:
      if (isString(value)) {
        formattedValue = $filter('linkify')(value);
      }
      break;
  }

  return formattedValue;
}
