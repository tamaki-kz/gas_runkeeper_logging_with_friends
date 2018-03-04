function checkUsersBySheetname(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var shs = ss.getSheets();
  for(i = 0; i < shs.length; i++) {
    if( shs[i].getSheetName() != 'graph'){
      Logger.log(shs[i].getSheetName());
      getUserStatus(shs[i].getSheetName());
    }
  }
}

function getUserStatus(user_id){
  var response = UrlFetchApp.fetch("https://runkeeper.com/user/"+user_id+"/profile");
  var text = response.getContentText();
  
  //正規表現でドットは改行以外の一文字なので、HTML等で改行をするTEXTの場合は下記の方法
  //https://os0x.g.hatena.ne.jp/os0x/20080213/1202900650
  var sActivities = text.match(/<h2>Activities[\s\S]*?<\/div>/)[0];
  var sKilometers = text.match(/<h2>Kilometers[\s\S]*?<\/div>/)[0];
  var sCalories = text.match(/<h2>Calories[\s\S]*?<\/div>/)[0];

  sActivities = sActivities.match(/\/>[\s\S]*?<\//)[0];  
  sKilometers = sKilometers.match(/\/>[\s\S]*?<\//)[0];
  sCalories = sCalories.match(/\/>[\s\S]*?<\//)[0];

  //数字をマッチング
  //http://www.megasoft.co.jp/mifes/seiki/s012.html
  sActivities = sActivities.match(/\b\d*\b/)[0];
  sKilometers = sKilometers.match(/\b\d*\b/)[0];
  sCalories = sCalories.match(/\b\d*\b/)[0];

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(user_id)
  var res = 0;

  vals = sh.getRange(2,1,1,4).getValues()
  if (vals[0][1] != sActivities | vals[0][2] != sKilometers | vals[0][3] != sCalories ){
    sh.insertRowAfter(1);
    var values = [[new Date(),sActivities,sKilometers,sCalories]];
    sh.getRange(2,1,1,4).setValues(values);
    
    var sh_g = ss.getSheetByName('graph');
    if( new Date() != sh_g.getRange(2, 1).getValue() ){
      sh_g.insertRowAfter(1);
      sh_g.getRange(2, 1).setValue(new Date());
    }
    switch(user_id){
      case 'kyskhykw':
        res = Number(sKilometers) -  sh_g.getRange(sh_g.getLastRow(), 3).getValue();
        sh_g.getRange(2, 3).setValue(res);
        break;
      case '2517545264':      
        res = Number(sKilometers) -  sh_g.getRange(sh_g.getLastRow(), 2).getValue();
        sh_g.getRange(2, 2).setValue(res);
        break;      
    }
  }
  if(res!=0){ sendGraph(); }
}

function sendGraph(){
  var mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("graph");
  var graphs = mySheet.getCharts()
  
  if( mySheet.getRange(2, 1).getValue() > (new Date()).getDate() - 1 ){  
    var notify_token = UserProperties.getProperty('LINENOTIFY_MYSELF');
    for(var i=0; i<graphs.length; i++ ){
        var pic = graphs[i].getBlob();
        sendHttpPostImage("本日の速報をお伝えします", pic, notify_token); //個人向け
    }
  }
}

function sendGraphWeekly(){
  var mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("graph");
  var graphs = mySheet.getCharts()
  
  if( mySheet.getRange(2, 1).getValue() > (new Date()).getDate() - 7 ){
    var notify_token = UserProperties.getProperty('LINENOTIFY_RUNKEEPER');
    for(var i=0; i<graphs.length; i++ ){
        var pic = graphs[i].getBlob();
        sendHttpPostImage("今週の進捗をお伝えします",pic, notify_token); 
    }
  }
}

function sendHttpPostImage(message, blob, token){
  var formData = {
   'message' : message,
   'imageFile': blob  // 地図画像を添付
  }
  var options =
   {
     "method"  : "post",
     "payload" : formData,  // message, imageFile を formData としてPost
     "headers" : {"Authorization" : "Bearer "+ token}
   };

   UrlFetchApp.fetch("https://notify-api.line.me/api/notify",options);
}
