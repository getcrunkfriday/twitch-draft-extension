/*

Chatbot for Minion Masters card selection in draft.
Uses boilerplate Twitch WebSocket IRC code. License information below:

Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

var token = "";
var tuid = "";

var twitch = window.Twitch.ext;
var resScale = 3;

function setAuth(token) {
  Object.keys(requests).forEach((req) => {
      twitch.rig.log('Setting auth headers');
      requests[req].headers = { 'Authorization': 'Bearer ' + token }
  });
}

twitch.onContext(function(context) {
  twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
  // save our credentials
  token = auth.token;
  tuid = auth.userId;
  // enable the button
  setAuth(token);
});

// Globals for keeping track of clicks and boxes.
var cnvs = document.getElementById("mmCanvas");
var boxes = [[],[],[]];
cnvs.addEventListener('click', canvasClicked);

function canvasClicked(event)
{
    var x = event.clientX;
    var y = event.clientY;
    console.log("Was clicked.",x,y);
    console.log(boxes[0]);
    for(var i = 0; i < boxes.length; i++)
    {
        if (boxes[i].length > 0)
        {
            if(x >= boxes[i][0] && x <= boxes[i][0]+boxes[i][2] && y >= boxes[i][1] && y <= boxes[i][1] + boxes[i][3])
            {
                boxClicked(i);
                break;
            }

        }
        
    }
}

function boxClicked(boxNum)
{
    // TODO: Placeholder for what to do when a box is clicked.
    console.log("Box",boxNum,"was clicked.");
}

function initialDraw(selectType,percentages)
    {
        if (selectType == 0)
        {
            var x=295/resScale;
            var y=310/resScale;
            var maxWidth=34/resScale;
            var cnvs= document.getElementById("mmCanvas");
            var ctx = cnvs.getContext("2d");
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var labels=["#A","#B","#C"];
            var percentageLabels=[(percentages[0]*100).toFixed(0).toString()+"%",(percentages[1]*100).toFixed(0).toString()+"%",(percentages[2]*100).toFixed(0).toString()+"%"];
            var maxPercentage=Math.max(...percentages);
            for (var i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.rect(x,y,430/resScale,510/resScale);
                ctx.lineWidth=1+(percentages[i]*maxWidth);
                console.log("line width "+ctx.lineWidth);
                if (percentages[i] === maxPercentage) {
                    ctx.strokeStyle="#FF0000";
                }
                else {
                    ctx.strokeStyle="#FFFFFF";
                }
                ctx.stroke();
                ctx.font = "italic 16px arial";
                if (percentages[i] === maxPercentage)
                {
                    ctx.fillStyle="#FF0000";
                }
                else {
                    ctx.fillStyle="#FFFFFF";
                }
                ctx.fillText(labels[i],  x+((510/resScale)/2)-60/resScale, y+(600/resScale));
                ctx.fillText(percentageLabels[i], (x+((510/resScale)/2)-70/resScale), y+(650/resScale));
                ctx.stroke();
                boxes[i]=[x,y,430/resScale,510/resScale];
                x+=450/resScale;
            }

        }
        else if (selectType == 1)
        {
            var x=590/resScale;
            var y=417/resScale;
            var maxWidth=44/resScale;
            var cnvs= document.getElementById("mmCanvas");
            var ctx = cnvs.getContext("2d");
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var labels=["#A","#B","#C"];
            var percentageLabels=[(percentages[0]*100).toFixed(0).toString()+"%",(percentages[1]*100).toFixed(0).toString()+"%",(percentages[2]*100).toFixed(0).toString()+"%"];
            var maxPercentage=Math.max(...percentages);
            for (var i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.rect(x,y,220/resScale,288/resScale);
                ctx.lineWidth=1+(percentages[i]*maxWidth);
                console.log("line width "+ctx.lineWidth);
                if (percentages[i] === maxPercentage) {
                    ctx.strokeStyle="#FF0000";
                }
                else {
                    ctx.strokeStyle="#FFFFFF";
                }
                ctx.stroke();
                ctx.font = "italic 16px arial";
                if (percentages[i] === maxPercentage)
                {
                    ctx.fillStyle="#FF0000";
                }
                else {
                    ctx.fillStyle="#FFFFFF";
                }
                ctx.fillText(labels[i],  x+((288/resScale)/2)-60/resScale, y+(350/resScale));
                ctx.fillText(percentageLabels[i], x+((288/resScale)/2)-70/resScale, y+(400/resScale));
                boxes[i]=[x,y,430/resScale,510/resScale];
                x+=260/resScale;
            }           
        }
        else if (selectType == -1) {
            var cnvs= document.getElementById("mmCanvas");
            var ctx = cnvs.getContext("2d");
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
    }   

initialDraw(1,[0,0,0]);