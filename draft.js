/*
Stream overlay methods for Twitch Draft extension.
*/


/* Twitch helper methods */
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

/* Canvas helper methods */
// Globals for keeping track of clicks and boxes.
var cnvs = document.getElementById("mmCanvas");
var boxes = [[],[],[]];
cnvs.addEventListener('click', canvasClicked);

/**
 * Captures the click on a canvas, and sends it to the active VotingContainer
 * to check which RectangleClickBox was clicked.
 * @param {MouseEvent} event 
 */
function canvasClicked(event)
{
    var x = event.clientX;
    var y = event.clientY;
    container.onVote(x, y)
}

/**
 * Checks if this is in between a and b.
 * 
 * @this an int that is checked if it is in between a and b.
 * @param {int} a 
 * @param {int} b 
 */
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

/* Overly style dictionaries.
TODO: Unify these into one */
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

/**
 * VotingContainer contains (typically) a group of options (RectangleClickBox),
 * and voting results based on which option was clicked.
 */
class VotingContainer
{
    /**
     * Initialize a voting container with no options.
     * @param {Context} ctx 
     */
    constructor(ctx)
    {
        this.ctx = ctx;
        this.total = 0;
        this.options = [];
        this.winners = [];
        this.maxVote = 0;
    }

    /**
     * When an option is clicked, recalculate the winning
     * option.
     * @param {RectangleClickBox} option 
     */
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

    /**
     * Add a new option.
     * @param {RectangleClickBox} option 
     */
    addOption(option)
    {
        this.options.push(option);
        this.total += option.vote;
        this.updateWinner(option);
    }


    /**
     * Called when the canvas is clicked at x,y.
     * @param {int} x 
     * @param {int} y 
     */
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

    /**
     * Increments the vote for an option, and makes
     * drawing updates.
     * @param {RectangleClickBox} option 
     */
    voteOption(option)
    {
        this.total += 1;
        option.vote += 1;
        this.updateWinner(option);
        this.draw();
    }

    /**
     * Check if an option was clicked, and return it.
     * @param {int} x 
     * @param {int} y 
     */
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

    /**
     * Redraw the containing options.
     */
    draw()
    {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (let option of this.options)
        {
            option.draw();
        }
    }
}

/**
 * Contains box/text positions and draw functions for voting options in an overlay. 
 */
class RectangleClickBox
{
    /**
     * Initializes a voting option.
     * @param {VotingContainer} container 
     * @param {String} label 
     * @param {int} x 
     * @param {int} y 
     * @param {int} width 
     * @param {int} height 
     */
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

    /**
     * Check if x and y are within this box.
     * @param {int} x 
     * @param {int} y 
     */
    containsPoint(x, y)
    {
        return (x.inBetween(this.x, this.x + this.width)
                && y.inBetween(this.y, this.y + this.height));
    }

    /**
     * Gets the position of the box label.
     */
    getLabelPos()
    {
        var x = this.x + this.width/2;
        var y = this.y + this.height + 20;
        return [x, y];
    }

    /**
     * Gets the position of the box percentage label.
     */
    getPercentagePos()
    {
        var x = this.x + this.width/2;
        var y = this.y + this.height + 40;
        return [x, y];
    }

    /**
     * Recalculate the ratio of clicks on this box versus
     * total clicks within the parent container.
     */
    get ratio()
    {
        return this.parent.total && this.vote / this.parent.total;
    }

    /**
     * Return a formatted string of the current vote ratio.
     */
    formatPercentage()
    {
        var percent = this.ratio * 100;
        return percent.toFixed(0).toString()+"%"
    }

    /**
     * Redraw the box based on current style options.
     */
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

/**
 * Builds a voting container based on the selectType.
 * TODO: Should build a container based on OverlayType.
 * @param {int} selectType 
 */
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

var OverlayType = freeze({"MINIONMASTERS":1});

/**
 * Template Overlay class. Meant to contain styles, and methods
 * for transitioning between VotingContainers.
 */
class Overlay {
    containers=[];
    styleOptions={};
    constructor(id,styleOptions) {
        this.id = id;
        this.containers= {};
        this.styleOptions = {};
    }
    next()
    {
    }
}

/**
 * Minion Masters Overlay class.
 * Contains overlay containers for Hero and Card voting.
 */
class MinionMastersOverlay extends Overlay {
    constructor(id,styleOptions) {
        super(id,Object.assign({},{
            "startingLineWidth":"1px",
            "maxLineWidth":"50px"
        },styleOptions));
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

// TODO: Should build container based on style options set in streamer panel.
var container = buildContainer(1);
container.draw();