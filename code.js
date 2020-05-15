function getAuthType() {
  var response = { type: 'NONE' };
  return response;
}

function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();
  
  config.newInfo()
    .setId('instructions')
    .setText('Verileri getirlecek site URL\'si');
  
  config.newTextInput()
    .setId('URL')
    .setName('Site adının tam girin')
  .setHelpText('ör. https://siyasihaber4.org')
    .setPlaceholder('https://siyasihaber4.org');
  
  config.setDateRangeRequired(false);
  
  return config.build();
}


function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;
  
  fields.newDimension()
    .setId('site')
    .setType(types.TEXT);
  
  fields.newMetric()
    .setId('global')
    .setType(types.NUMBER);
  
   fields.newMetric()
    .setId('country')
    .setType(types.NUMBER);
  
  return fields;
}

function extractHostname(url="https://siyasihaber.org") {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

function responseToRows(requestedFields, response, URL) {
  // Transform parsed data and filter for requested fields
  return response.map(function(rank) {
    var row = [];
    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
        case 'global':
          return row.push(rank.global);
        case 'country':
          return row.push(rank.country);
        case 'site':
          return row.push(extractHostname(URL));
        default:
          return row.push('');
      }
    });
    return { values: row };
  });
}

function getData(request) {
   Logger.log(request)
  try {
    var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);
  
  // Fetch and parse data from API
  
 var url = "http://data.alexa.com/data?cli=10&url=" + request.configParams.URL
 var xml = UrlFetchApp.fetch(url).getContentText();
 var document = XmlService.parse(xml);
 var sd = document.getRootElement().getChildren('SD')[0];
 var global = sd.getChild("POPULARITY")
 var country = sd.getChild("COUNTRY")
 var parsedResponse = [{country:country.getAttributes()[2].getValue() , global:global.getAttributes()[1].getValue()}]
 var rows = responseToRows(requestedFields, parsedResponse, request.configParams.URL);
 Logger.log(rows)
 Logger.log( {schema: requestedFields.build(), rows: rows})
  return {
    schema: requestedFields.build(),
    rows: rows
  };
  // Code that might fail.
  } catch (e) {
    Logger.log(e)
    logConnectorError(e, 'quota_hour_exceeded'); // Log to Stackdriver.
    throwConnectorError('You\'ve exceeded the hourly quota. Try again later.', true);
  }
   
}

function logConnectorError(originalError, message) {
  var logEntry = [
    'Original error (Message): ',
    originalError,
    '(', message, ')'
  ];
  console.error(logEntry.join('')); // Log to Stackdriver.
}

function throwConnectorError(message, userSafe) {
  userSafe = (typeof userSafe !== 'undefined' &&
              typeof userSafe === 'boolean') ? userSafe : false;
  if (userSafe) {
    message = 'DS_USER:' + message;
  }

  throw new Error(message);
}
