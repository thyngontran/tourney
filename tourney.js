var myApp = angular.module('tourneyApp', [], function($locationProvider)  {
    $locationProvider.html5Mode(true);    
});

myApp.controller('TourneyListController', function($http, $location) {
    var playerList = this;
    var isAdmin = false;
    var apiurl = "https://seciy1x5d1.execute-api.us-east-1.amazonaws.com/prod/retrieveplayers";
    
    playerList.names = [
      {PlayerId:'1', text:'Isabella Tran', checkin:false, group:"Gold", team:0, net:0, gameWon:0, gameLost:0, gamePlayed:0, totalPoints:0},
      {PlayerId:'2', text:'Kaitlin Tran', checkin:false, group:"Gold", team:0, net:0, gameWon:0, gameLost:0, gamePlayed:0, totalPoints:0}
    ];
    
    
    
    var params = $location.search();
    if(params != null)
        isAdmin = params.admin;
  
    console.log("Admin flag:" + isAdmin);
    
    //var apiurl = "input.txt";
    var request={};// empty parameters
    var headers = {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
        'Mine-Type': 'application/json; charset=utf-8'
    };
    
    $http.get(apiurl,request,{headers})
        .then(function Success(response){
        playerList.names = response.data.players;
        console.log("Response TTT:" + playerList.names);
      }, function Error(response){ //handler errors here
        console.log("tttttt"+response.statusText);
      });
    
    
    playerList.selectAllFlag = false;

    playerList.totalNet = 0;
    playerList.pool1TeamSize = 2;
    playerList.pool2TeamSize = 2;
    playerList.teamSize = 4;  //default
    playerList.generatedPool1 = [];
    playerList.generatedPool2 = [];
    playerList.generatedPool3 = [];
    playerList.allTeamCount = 0;
    
    //for tracking games points
    playerList.trackTeamWon = '';
    playerList.trackPointDif = 0;
    playerList.trackTeamLost = '';
    
 
    playerList.addPlayer = function() {
        playerList.saveStatusText = "";

        playerList.names.push({text:playerList.newNameText, checkin:true, group:playerList.newPoolText, team:0, net:0, gameWon:0,gamePlayed:0,gameLost:0,totalPoints:0,PlayerId:""+new Date().getTime()});
        playerList.newNameText = '';
        playerList.newPoolText = '';
    };
 
    playerList.remaining = function() {
      var count = 0;
      angular.forEach(playerList.names, function(player) {
        count += (player.checkin) ? 1 : 0;
      });
      return count;
    };
    
    playerList.selectAll = function() {
        playerList.saveStatusText = "";

        console.log("SelectAll flag:"+playerList.selectAllFlag);
        
        angular.forEach(playerList.names, function(player) {
            player.checkin = playerList.selectAllFlag;
        });
    };
    
    playerList.resetTourney = function() {

        playerList.saveStatusText = "";

        angular.forEach(playerList.names, function(player) {
            player.gameWon=0;
            player.gameLost=0;
            player.gamePlayed=0;
            player.totalPoints=0;
            player.team = 0;
            player.net = 0;
            player.checkin = false;
            
        });

    }
    
    
    playerList.recordGame = function() {
        
        playerList.saveStatusText = "";
        
        angular.forEach(playerList.names, function(player) {
                //handle undefine nubmer;
            if (player.gameWon == null) player.gameWon=0;
            if (player.gameLost == null) player.gameLost=0;
            if (player.gamePlayed == null) player.gamePlayed=0;
            if (player.totalPoints == null) player.totalPoints=0;
            
            //record all player on winner team
            if (player.checkin && player.team == playerList.trackTeamWon) {
                
                
                console.log ("Track gamewon:"+player.gameWon+"totalPoints"+player.totalPoints+"pointDif"+playerList.trackPointDif);
                
                player.gameWon++;
                player.totalPoints = Number(player.totalPoints) + Number(playerList.trackPointDif);
                //increase #gameplayed
                player.gamePlayed++;
            }
            
            //record all player on losing team
            if (player.checkin && player.team == playerList.trackTeamLost) {
                player.gameLost++;
                player.totalPoints = Number(player.totalPoints) - Number(playerList.trackPointDif);

                //increase #gameplayed
                player.gamePlayed++;
            }
                  
        });
        
        alert("Scores Recorded Successfully!!!");
    }
    
    
    playerList.archive = function() {
        playerList.saveStatusText = "";
      
            var addPlayerUrl = "https://seciy1x5d1.execute-api.us-east-1.amazonaws.com/prod/addplayer";
        
              var oldNames = playerList.names;
              var count = 0;
              angular.forEach(oldNames, function(player) {
                  
                  //handle undefine nubmer;
                  if (player.gamePlayed == null || player.gamePlayed == '') player.gamePlayed=0;
                  if (player.gameWon == null || player.gameWon == '') player.gameWon=0;
                  if (player.gameLost == null|| player.gameLost == '') player.gameLost=0;
                  if (player.totalPoints == null|| player.totalPoints == '') player.totalPoints=0;
          
                  //save to server 
                  $http.post(addPlayerUrl,player).
                  then(function(response){
                      console.log("Success Save:"+JSON.stringify(player));

                  });
              });
        
        playerList.saveStatusText = "Saved Successfully.";
        alert("Saved Successfully!!!");

    };

    playerList.letsGo = function() {
        
        var generatedPool1 = [];
        var generatedPool2 = [];
        var generatedPool3 = [];
        playerList.allTeamCount = 0;
        playerList.totalNet = 1;
        playerList.saveStatusText = "";
        
        angular.forEach(playerList.names, function(player) {   
                    
          if (player.group =="Gold" && player.checkin){
              generatedPool1.push(player);
          } else if (player.group =="Silver" && player.checkin) {              
              generatedPool2.push(player);
          } else { //unknown
              if(player.checkin){
                 generatedPool3.push(player);
              }
          }          
          
        });
        
        //randomize pool1
        playerList.shuffleArray(generatedPool1);
        
        //assign team number
        var pool1TeamCount = 1;   
        var pool1NumberTeam = Math.round(generatedPool1.length / playerList.pool1TeamSize);
        generatedPool1.forEach(function(player) {
            player.team = pool1TeamCount++;
            player.net = Math.round(player.team/2);
            if(pool1TeamCount > pool1NumberTeam){
                pool1TeamCount = 1
            }
            playerList.allTeamCount = (playerList.allTeamCount > pool1TeamCount)?playerList.allTeamCount:pool1TeamCount;
         
        });   

        //randomize pool2
        playerList.shuffleArray(generatedPool2);
        
        //assign team number
        var pool2TeamCount = playerList.allTeamCount+1;   
        var pool2TeamCountOrg = pool2TeamCount;   
        var pool2NumberTeam = Math.round(generatedPool2.length / playerList.pool2TeamSize);
        generatedPool2.forEach(function(player) {
            player.team = pool2TeamCount++;
            player.net = Math.round(player.team/2);
            if((pool2TeamCount-pool2TeamCountOrg)+1 > pool2NumberTeam){
                pool2TeamCount = pool2TeamCountOrg;
            }
            
            playerList.allTeamCount = (playerList.allTeamCount > pool2TeamCount)?       playerList.allTeamCount:pool2TeamCount;
         
        });   
        
        
        
        //randomize pool3
        playerList.shuffleArray(generatedPool3);
        
        //assign team number
        var pool3TeamCount = playerList.allTeamCount+1;   
        var pool3TeamCountOrg = pool3TeamCount;   
        var pool3NumberTeam = Math.round(generatedPool3.length / playerList.teamSize);
        generatedPool3.forEach(function(player) {
            console.log("Allteamcount"+playerList.allTeamCount);
            console.log("pool3TeamCount before + 1 " + pool3TeamCount);

            player.team = pool3TeamCount++;
            player.net = Math.round(player.team/2);
            if((pool3TeamCount-pool3TeamCountOrg)+1 > pool3NumberTeam){
                pool3TeamCount = pool3TeamCountOrg
            }
            playerList.allTeamCount = (playerList.allTeamCount > pool3TeamCount)?playerList.allTeamCount:pool3TeamCount;
         
        });   
        
        //update model for view
        playerList.generatedPool1 = [];
        angular.forEach(generatedPool1, function(player) {   
            playerList.generatedPool1.push(player);
        });
        
        //update model for view
        playerList.generatedPool2 = [];
        angular.forEach(generatedPool2, function(player) {   
            playerList.generatedPool2.push(player);
        });
        
        //update model for view
        playerList.generatedPool3 = [];
        angular.forEach(generatedPool3, function(player) {   
            playerList.generatedPool3.push(player);
        });
        
        
        playerList.statusText = "Need " + Math.round(playerList.allTeamCount/2) + " Nets Totals"; 
        
        //alert(playerList.statusText);

    };
    
    // -> Fisher–Yates shuffle algorithm
    playerList.shuffleArray = function(array) {
      var m = array.length, t, i;
  
    // While there remain elements to shuffle
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
  
    return array;
  }


});