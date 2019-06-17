/* Global Progression Checkers */
var gblAvgSpd = false;
var gblCalcClicked = false;
var gblFixChecker = false;
var gblMinChecker = 0;
var gblStartTime = false;
var gblStartDist = false;

/* Starting */
var sHours = 0;
var sMins = 0;
var sSecs = 0;
var sDist = 0;
var uCode = '';
var timeDif = 0;
var correctionFactor = 1;

/* Changeable */
var prevMins = 0;
var extraMins = 0;
var prevKms = 0;
var extraKms = 0;
var avgSpeedChanges = [];
var resultLineObj = {};
var gblODO = 0;

function go() { /* On page load */
	saveStartTime();
	saveStartDistance();
	saveAvgSpeed();
	uCode = prompt("What is the code for U-Turns?\neg. 'U'","u").toUpperCase();
	resultLineObj = {
		loc: 'Start',
		odo: gblODO,
		idT: document.getElementById("calcTime").innerText,
		acT: document.getElementById('clockText').innerText,
		avS: avgSpeedChanges[avgSpeedChanges.length-1][1],
		chk: '',
		min: extraMins,
		kms: extraKms
	};
}
function saveStartTime() { /* Saves start time value as global variable (incl. Hours, Mins, Secs) */
	var time = prompt("Start Time?\n(eg. 19 30 00)", "19 30 00");
	time = time.split(' ');
	if (time.length === 3) {
		sHours = parseInt(time[0]);
		sMins = parseInt(time[1]);
		sSecs = parseInt(time[2]);
		gblStartTime = true;
	console.log("Start Time saved...");
	} else {
		alert("Not a valid time!");
		console.error("Invalid Start Time");
		saveStartTime();
	}
}
function saveStartDistance() { /* Saves start distance as global variable */
	var dist = prompt("Start Distance?\n(eg. 00.0)", "00.0");
	dist = parseFloat(dist);
	if (isNaN(dist)) {
		alert("Not a valid distance!");
		console.error("Invalid Start Distance");
		saveStartDistance();
	} else {
		sDist = dist;
		gblStartDist = true;
		console.log("Start Distance saved...");
	}
}

function clockButton() { /* Checks start time is saved */
	if (gblStartTime === false) {
		alert("Verify starting time!");
		console.error("Start Time not verified");
	} else {
		getTimeDifference();
		console.log("Starting clock...");
		startClock();
		printResults();
	}
}
function getTimeDifference() { /* Gets difference between Start Time and Current Time in milliseconds */
	var today = new Date();
	var cHours = today.getHours();
	var cMins = today.getMinutes();
	var cSecs = today.getSeconds();
	cHours = addZero(cHours);
	cMins = addZero(cMins);
	cSecs = addZero(cSecs);
	var dHours = cHours - sHours;
	dHours = dHours * 3600000;
	var dMins = cMins - sMins;
	dMins = dMins * 60000;
	var dSecs = cSecs - sSecs;
	dSecs = dSecs * 1000;
	timeDif = dHours + dMins + dSecs;
	console.log("Time difference successfully calculated...");
}
function startClock() { /* Starts clock */
	var today = new Date();
	today.setMilliseconds(today.getMilliseconds()-timeDif);
	var h = today.getHours();
	var m = today.getMinutes();
	var s = today.getSeconds();
	if (document.getElementById('12hr').checked) {
		if (h > 12) {
			h -= 12;
		}
	}
	h = addZero(h);
	m = addZero(m);
	s = addZero(s);
	document.getElementById('clockText').innerHTML = h + ':' + m + ':' + s;
	var t = setTimeout(startClock, 500);
}

function printResults() { /* Prints contents of resultLineObj to table row */
	calcTime();
	resultLineObj.odo = gblODO;
	resultLineObj.idT = document.getElementById("calcTime").innerText;
	resultLineObj.acT = document.getElementById('clockText').innerText;
	if (gblFixChecker === true) {
		for (var i in avgSpeedChanges) {
			if (avgSpeedChanges[i][0] == gblODO) {
				var index = i;
				break;
			}
		}
		resultLineObj.avS = avgSpeedChanges[index][1];
	} else {
		if (gblAvgSpd === false) {
			resultLineObj.avS = '';
		} else {
			resultLineObj.avS = avgSpeedChanges[avgSpeedChanges.length-1][1];
		}
	}
	resultLineObj.min = parseInt(extraMins-prevMins);
	resultLineObj.kms = Number((parseFloat(extraKms-prevKms)).toFixed(1));
	if (resultLineObj.min === 0) {
		resultLineObj.min = '';
	}
	if (resultLineObj.kms === 0) {
		resultLineObj.kms = '';
	}
	var tbody = document.getElementById("resultTable_tbody");
	var tr = document.createElement("tr");
	for (var i in resultLineObj) {
		var td = document.createElement("td");
		var str = document.createTextNode(resultLineObj[i]);
		td.appendChild(str);
		tr.appendChild(td);
	}
	var idealTimeInt = parseInt(resultLineObj.idT.split(':').join(''));
	var actualTimeInt = parseInt(resultLineObj.acT.split(':').join(''));
	if (gblFixChecker === true) {
		console.warn("AVERAGE SPEED FIXED");
		tr.setAttribute("class","fixed");		
	} else if (idealTimeInt > actualTimeInt) {
		tr.setAttribute("class","early");
	} else if (idealTimeInt < actualTimeInt) {
		tr.setAttribute("class","late");
	}
	tbody.appendChild(tr);
	gblAvgSpd = false;
	gblFixChecker = false;
	resultLineObj.loc = '';
	resultLineObj.chk = '';
	prevMins = extraMins;
	prevKms = extraKms;
	var objDiv = document.getElementById("resultTable");
	objDiv.scrollTop = objDiv.scrollHeight;
}
function calcTime() { /* Calculates estimated time: sTime + ((ODO - sDist) / avgSpd) + extraMins */
	var ODO;
	if (gblCalcClicked === true) {
		ODO = getODO();
		gblCalcClicked = false;
	} else {
		ODO = gblODO;
	}
	var sTime = sHours*3600+sMins*60+sSecs;
	var	stDist = sDist;
	var estTime = 0;
	var estAvgs;
	for (var i in avgSpeedChanges) { /* Fix for changes in average speed */
		var last = avgSpeedChanges.length - 1;
		var avgODO = avgSpeedChanges[i][0];
		var avgSpd = avgSpeedChanges[i][1];
		avgODO = avgODO * 1000;
		if (i == last) {
			var curODO = ODO*correctionFactor;
			curODO -= stDist;
			// curODO -= extraKms * correctionFactor;
			curODO -= avgSpeedChanges[i][2] * correctionFactor;
			curODO = curODO * 1000;
			estAvgs = (curODO - avgODO) / (avgSpd/3.6);
			estTime += estAvgs;
			console.log("I am the last...");
		} else {
			var next = parseInt(i) + 1;
			var nextODO = avgSpeedChanges[next][0];
			nextODO -= avgSpeedChanges[i][2] * correctionFactor;
			nextODO = nextODO * 1000;
			estAvgs = (nextODO - avgODO) / (avgSpd/3.6);
			estTime += estAvgs;			
		}
		console.log(estTime);
	}
	var fEstTime = sTime + estTime + ((extraMins-gblMinChecker)*60);
	gblMinChecker = 0;
	var h = parseInt(fEstTime / 3600);
	fEstTime -= parseInt(h * 3600);
	var m = parseInt(fEstTime / 60);
	fEstTime -= parseInt(m * 60);
	var s = parseInt(fEstTime);
	if (document.getElementById('12hr').checked) { /* Changes time format */
		if (h > 12) {
			h -= 12;
		}
	}
	h = addZero(h);
	m = addZero(m);
	s = addZero(s);
	document.getElementById("calcTime").innerHTML = h + ":" + m + ":" + s;
	var idealTimeInt = parseInt(document.getElementById("calcTime").innerText.split(':').join(''));
	var actualTimeInt = parseInt(document.getElementById('clockText').innerText.split(':').join(''));
	if (idealTimeInt > actualTimeInt) {
		document.getElementById("calcTime").setAttribute("class","earlyText");
	} else if (idealTimeInt < actualTimeInt) {
		document.getElementById("calcTime").setAttribute("class","lateText");
	}
}

function addODO() { /* Calculate correction factor based on organiser's ODO */
	var curODO = getODO();
	var orgODO = parseFloat(prompt("What is the organiser's ODO?"));
	correctionFactor =  orgODO/curODO;
	resultLineObj.loc = "ODO";
	var label = document.getElementById("orgODO");
	label.innerText = "Org:" + orgODO + " / Our:" + curODO + " = " + correctionFactor.toFixed(2);
	printResults();
}
function saveAvgSpeed() { /* Saves average speed in a global variable array [ODO,speed]*/
	var spd;
	var ODO;
	if (avgSpeedChanges.length === 0) { /* First average speed, ODO is 0 */
		spd = prompt("Average Speed?\n(eg. 60)", "60");
		spd = parseFloat(spd);
		if (isNaN(spd)) {
			alert("Not a valid speed!");
			console.error("Invalid Average Speed");
			saveAvgSpeed();
		} else {
			ODO = 0.0;
			avgSpeedChanges.push([ODO,spd,0]);
			gblAvgSpd = true;
		}
	} else {
		ODO = getODO();
		spd = prompt("Average Speed?\n(eg. 60)", "60");
		spd = parseFloat(spd);
		if (isNaN(spd)) {
			alert("Not a valid speed!");
			console.error("Invalid Average Speed");
			saveAvgSpeed();
		} else {
			ODO = ODO*correctionFactor;
			avgSpeedChanges.push([ODO,spd,0]);
			var loc = prompt("Location for average speed?");
			resultLineObj.loc = loc.capitalise();
			gblAvgSpd = true;
			printResults();
		}
	}
	console.log("Average Speed and ODO saved...");
}
function avgSpeedFix() { /* Change average speed at a specific ODO */
	var ODOtoFind = (parseFloat(prompt("What was the ODO when the mistake was made?")))*correctionFactor;
	for (var i in avgSpeedChanges) {
		console.log(avgSpeedChanges[i][0], ODOtoFind);
		if (avgSpeedChanges[i][0] == ODOtoFind) {
			var mistakeIndex = i;
			break;
		}
	}
	avgSpeedChanges[mistakeIndex][0] = parseFloat(prompt("What is the correct ODO?"));
	avgSpeedChanges[mistakeIndex][1] = parseFloat(prompt("What is the correct average speed?"));
	avgSpeedChanges[mistakeIndex][2] = parseFloat(prompt("What were the added KMs?"));
	gblODO = avgSpeedChanges[mistakeIndex][0];
	gblFixChecker = true;
	printResults();
}

function addCheck() { /* Add check */
	var ODO = getODO();
	var chk = prompt("Name of check?");
	chk = chk.toUpperCase();
	if (chk.includes(uCode) === true) {
		var re = new RegExp(uCode,'g');
		var numMatches = chk.match(re).length;
		extraMins += numMatches;
		gblMinChecker = numMatches;
		console.log("Added " + numMatches + " U-Turn at " + ODO + "...");
	}
	resultLineObj.chk = chk;
	printResults();
}
function addManCheck() { /* Add manned check */
	var ODO = getODO();
	var mcConfirm = false;
	var acT;
	if (!confirm("Are you on time?")) {
		doSave();
        window.open('timekeeping.html');
		// mcConfirm = true;
		// acT = prompt("Enter new time","eg. 19:30:00");
	}
	var chk = "Manned Check";
	chk = chk.toUpperCase();
	extraMins += 1;
	gblMinChecker = 1;
	console.log("Added 1 Manned Check at " + ODO + "...");
	resultLineObj.chk = chk;
	if(mcConfirm) resultLineObj.acT = acT;
	printResults();
}
function addXBoard() { /* Add X-Board */
	var ODO = getODO();
	var loc = "X-Board";
    extraMins += 1;
    gblMinChecker = 1;
    console.log("Added 1 X_Board at " + ODO + "...");
    resultLineObj.loc = loc;
    printResults();
}
function addMinute() { /* Add minute */
	var ODO = getODO();
	var c = parseInt(prompt("How many minutes?", "1"));
	if (isNaN(c)) {
		alert("Not a valid number!");
		addMinute();
	} else {
		extraMins += c;
		gblMinChecker = c;
		console.log("Added 1 U-Turn at " + ODO + "...");
		printResults();
	}
}
function addMileage() { /* Add kilometres */
	var ODO = getODO();
	var km = parseFloat(prompt("Add how many kms?"));
	if (km !== '') {
		extraKms += km;
		var cur = avgSpeedChanges.length - 1;
		avgSpeedChanges[cur][2] += km;
		console.log(avgSpeedChanges[cur]);
		console.log("Added " + km + " kilometres at " + ODO + "...");
		printResults();
	}
}

function getODO() { /* Defines local ODO variable given input or prompt */
	var ODO = parseFloat(prompt("Enter your ODO"));
	if (isNaN(ODO)) {
		alert("Not a valid distance!");
		console.error("Invalid ODO");
		getODO();
	} else {
		gblODO = ODO;
		return ODO;
	}
}
function addZero(n) { /* Adds zero to a number less than 10 */
	if (n < 10) {
		n = "0" + n;
	}
	return n;
}
String.prototype.capitalise = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var doSave = function () { /* outText && filename = changeable */
	var resultTable, outText, filename;
	/* Get date for filename **********/
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();
	if(dd<10) {
		dd='0'+dd;
	} 
	if(mm<10) {
		mm='0'+mm;
	}
	today = mm+'-'+dd+'-'+yyyy;
	/**********************************/
	resultTable = document.getElementById("resultTable_table");
	outText = "";
	for (var row = 0 ; row < resultTable.rows.length ; row++) {
		for (var cell = 0 ; cell < resultTable.rows[row].cells.length ; cell++) {
			var cellStr = resultTable.rows[row].cells[cell].innerText;
			while (cellStr.length < 20) {
				cellStr = " " + cellStr;
			}
			outText += cellStr;
		}
		outText += "\r\n";
	}
	filename = "TimekeepingResults_" + today + ".txt";
  saveTextAsFile(outText, filename);
};
var saveTextAsFile = function (textToWrite, fileNameToSaveAs) { /* Required. Keep unchanged */
  var textFileAsBlob = new Blob([textToWrite], {
    type: 'text/plain'
  });

  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";

  if (URL !== null) {
    downloadLink.href = URL.createObjectURL(textFileAsBlob);
  }

  downloadLink.click();
};
