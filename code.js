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
  .setHelpText('ör. https://ikon-x.com.tr')
    .setPlaceholder('https://ikon-x.com.tr');
  
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

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

function getData(request) {
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);

  // Fetch and parse data from API
  
 var url = "http://data.alexa.com/data?cli=10&url=" + request.configParams.site
 var xml = UrlFetchApp.fetch(url).getContentText();
 var sd = document.getRootElement().getChildren('SD')[0];
 var global = sd.getChild("POPULARITY")
 var country = sd.getChild("COUNTRY")
 var rows = {values: [request.configParams.site,global,country]}

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}
