import mapping from './responsibleMapping.json' assert { type: 'json' };

/**
 * Get current time in Cyprus timezone (UTC+2 or UTC+3 depending on DST)
 * Returns { dayOfWeek: 0-6 (0=Sunday), hour: 0-23, minute: 0-59 }
 */
function getCyprusTime() {
  // Cyprus is UTC+2 (EET) or UTC+3 (EEST) - use Europe/Nicosia
  const now = new Date();
  const cyprusTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Nicosia' }));
  
  return {
    dayOfWeek: cyprusTime.getDay(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    hour: cyprusTime.getHours(),
    minute: cyprusTime.getMinutes()
  };
}

/**
 * Determine responsible based on weekday schedule:
 * - Monday 9:01 → Alena (Alena Karakova)
 * - Friday 19:01 → Helen (Helen Bozbei)
 * Otherwise use mapping rules
 */
function getResponsibleBySchedule() {
  const { dayOfWeek, hour, minute } = getCyprusTime();
  const { byWeekday = {} } = mapping;
  
  // Monday = 1, Friday = 5
  if (dayOfWeek === 1 && hour >= 9 && minute >= 1) {
    // Monday 9:01+ → Alena
    return byWeekday['1'] || null;
  }
  
  if (dayOfWeek === 5 && hour >= 19 && minute >= 1) {
    // Friday 19:01+ → Helen
    return byWeekday['5'] || null;
  }
  
  // Before Monday 9:01 or between Monday 9:01 and Friday 19:01 → use current weekday
  if (byWeekday[String(dayOfWeek)]) {
    return byWeekday[String(dayOfWeek)];
  }
  
  return null;
}

/**
 * Resolve Bitrix responsible (ASSIGNED_BY_ID) based on Shopify order.
 * Priority: byWeekday schedule -> byTag -> byCountryCode -> bySource -> default.
 * Logs warning if matched by default.
 */
export function resolveResponsibleId(order) {
  const {
    default: defaultId = null,
    byTag = {},
    byCountryCode = {},
    bySource = {},
  } = mapping;

  // 0) By weekday schedule (Monday 9:01 → Alena, Friday 19:01 → Helen)
  const scheduleResponsible = getResponsibleBySchedule();
  if (scheduleResponsible) {
    return scheduleResponsible;
  }

  // 1) By tag
  const tags = (order.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  for (const tag of tags) {
    if (byTag[tag]) {
      return byTag[tag];
    }
  }

  // 2) By country code (shipping or billing)
  const countryCode =
    order.shipping_address?.country_code ||
    order.billing_address?.country_code ||
    null;
  if (countryCode && byCountryCode[countryCode]) {
    return byCountryCode[countryCode];
  }

  // 3) By source
  const source = order.source_name || '';
  if (source && bySource[source]) {
    return bySource[source];
  }

  // 4) Default
  if (defaultId) {
    console.warn(`Responsible matched by default for order ${order.id}`);
    return defaultId;
  }

  console.warn(`Responsible not resolved for order ${order.id}`);
  return null;
}

