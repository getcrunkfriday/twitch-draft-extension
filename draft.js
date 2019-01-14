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
var maxWidth = 34 / resScale;

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
    container.onVote(x, y)
}

var inBetween = function(a, b)
{
    if(a>b)
    {
        return this >= b && this <= a;
    }
    else
    {
        return this >= a && this <= b;
    }
}
Number.prototype.inBetween = inBetween;


var selectedBoxStyle = {
    "strokeStyle": "#FF0000"
};

var unselectedBoxStyle = {
    "strokeStyle": "#FFFFFF"
};

var boxStyles = {
    "selected": selectedBoxStyle,
    "unselected": unselectedBoxStyle
};

var commonTextStyle = {
    "font": "italic 16px arial",
    "textAlign": "center"
}

var selectedTextStyle = {
    "fillStyle": "#FF0000"
};

var unselectedTextStyle = {
    "fillStyle": "#FFFFFF"
};

var textStyles = {
    "selected": Object.assign({}, selectedTextStyle, commonTextStyle),
    "unselected": Object.assign({}, unselectedTextStyle, commonTextStyle)
};


class VotingContainer
{
    constructor(ctx)
    {
        this.ctx = ctx;
        this.total = 0;
        this.options = [];
        this.winners = [];
        this.maxVote = 0;
    }


    updateWinner(option)
    {
        if (option.vote === this.maxVote)
        {
            this.winners.push(option);
            option.select();
        }
        if (option.vote > this.maxVote)
        {
            this.maxVote = option.vote;
            for (let winner of this.winners)
            {
                winner.unselect();
            }
            this.winners = [option];
            option.select();
        }
    }

    addOption(option)
    {
        this.options.push(option);
        this.total += option.vote;
        this.updateWinner(option);
    }


    onVote(x, y)
    {
        console.log(x, y)
        var option = this.getOption(x, y)
        if (option)
        {
            console.log("1 vote for " + option.label);
            this.voteOption(option);
        }
        else
        {
            console.log("Invalid vote!.");
        }
    }


    voteOption(option)
    {
        this.total += 1;
        option.vote += 1;
        this.updateWinner(option);
        this.draw();
    }


    getOption(x, y)
    {
        for (let option of this.options)
        {
            if (option.containsPoint(x, y))
            {
                return option;
            }
        }
        return null;
    }


    draw()
    {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (let option of this.options)
        {
            option.draw();
        }
    }
}

class RectangleClickBox
{
    constructor(container, label, x, y, width, height)
    {
        this.parent = container;
        this.ctx = container.ctx;
        this.label = label;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.style = "unselected";
        this.vote = 0;
    }


    select()
    {
        this.style = "selected";
    }


    unselect()
    {
        this.style = "unselected";
    }


    containsPoint(x, y)
    {
        return (x.inBetween(this.x, this.x + this.width)
                && y.inBetween(this.y, this.y + this.height));
    }


    getLabelPos()
    {
        var x = this.x + this.width/2;
        var y = this.y + this.height + 20;
        return [x, y];
    }


    getPercentagePos()
    {
        var x = this.x + this.width/2;
        var y = this.y + this.height + 40;
        return [x, y];
    }


    get ratio()
    {
        return this.parent.total && this.vote / this.parent.total;
    }


    formatPercentage()
    {
        var percent = this.ratio * 100;
        return percent.toFixed(0).toString()+"%"
    }


    draw()
    {
        this.ctx.beginPath();
        this.ctx.rect(this.x, this.y, this.width, this.height);
        this.ctx.lineWidth = 1 + this.ratio * maxWidth;
        for (var key in boxStyles[this.style])
        {
            this.ctx[key] = boxStyles[this.style][key];
        }
        this.ctx.stroke();
        for (var key in textStyles[this.style])
        {
            this.ctx[key] = textStyles[this.style][key];
        }
        var [x, y] = this.getLabelPos();
        this.ctx.fillText(this.label, x, y);
        var [x, y] = this.getPercentagePos();
        this.ctx.fillText(this.formatPercentage(), x, y);
    }
}


class LayOut
{
    constructor()
    {
        this.elements = [];
    }
}


function buildContainer(selectType)
{
    if (selectType == 1)
    {
        var x=590/resScale;
        var y=417/resScale;
        var width=220/resScale;
        var height=288/resScale;
        var cnvs= document.getElementById("mmCanvas");
        var ctx = cnvs.getContext("2d");
        var voteContainer = new VotingContainer(ctx);
        var labels=["#A","#B","#C"];
        for (var i = 0; i < 3; i++)
        {
            var option = new RectangleClickBox(
                voteContainer, labels[i], x, y, width, height);
            voteContainer.addOption(option);
            x += 260/resScale;
        }
        return voteContainer;
    }
}

/*
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
*/

var container = buildContainer(1);
container.draw();