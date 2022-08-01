var querystring = require('querystring');
var fs = require('fs');

// Note: insert the absolute path to the project
var PROJECTPATH = '/home/master/awt-pj-ss22-streaming-analytics-using-cmcd-and-cmsd-1/CMSD-DASH/';
//var PROJECTPATH = '/home/max/Documents/awt-pj-ss22-streaming-analytics-using-cmcd-and-cmsd-1/CMSD-DASH/';

var LOGPATH = PROJECTPATH + 'server/logs/';

var LOGFILE = LOGPATH + 'cmsd.log';
var CSVFILE = LOGPATH + 'cmsd.csv';
var CONFIGFILE = LOGPATH + 'cmsd_config.json';

var SERVER1INFO = PROJECTPATH + 'server/nginx/config/server1.json'

//following two values impact, how many clients can be connected to this server
var LOAD_PER_CLIENT = 20
var OVERLOAD_THRESHOLD = 60

//this value is divided by the number of clients and determines their maximal bitrate
var SHARED_BANDWIDTH = 10000

function writeLog(msg) {
    var dateTime = new Date().toLocaleString();
    var logLine = ('\n[' + dateTime + '] ' + msg);
    try {
        fs.appendFileSync(LOGFILE, logLine);
    } catch (e) {
        // unable to write to file
    }
}

function writeCsv(metricsObj) {
    // One header and value row for each metricsObj for now
    var csvHeaders = 'timestamp, '
    var timestamp = Math.floor(new Date() / 1000);
    var csvLine = timestamp + ', ';

    for (const key in metricsObj) {
        if (metricsObj.hasOwnProperty(key)) {
            csvHeaders += (key + ', ')
            csvLine += (metricsObj[key] + ', ')
        }
    }

    csvHeaders += '\n'
    csvLine += '\n'

    try {
        fs.appendFileSync(CSVFILE, csvHeaders);
        fs.appendFileSync(CSVFILE, csvLine);
    } catch (e) {
        // unable to write to file
        fs.appendFileSync(CSVFILE, "ERROR: Unable to write to file");
        fs.appendFileSync(CSVFILE, e);
    }
}

function writeConfig(key, value) {
    try {
        var jsonStr = fs.readFileSync(CONFIGFILE);
        var jsonObj = JSON.parse(jsonStr);
        // writeLog('[writeConfig] CONFIGFILE exists');
    } catch (e) {
        // writeLog('[writeConfig] CONFIGFILE not exists, e: ' +  e + '.. creating new jsonObj..');
        var jsonObj = {};
    }

    jsonObj[key] = value;    // update key-value

    try {
        fs.writeFileSync(CONFIGFILE, JSON.stringify(jsonObj));
    } catch (e) {
        // unable to write config
    }
}

function readConfig(key) {
    try {
        var jsonStr = fs.readFileSync(CONFIGFILE);
        var jsonObj = JSON.parse(jsonStr);
        // writeLog('[readConfig] CONFIGFILE exists')
        return jsonObj[key];
    } catch (e) {
        // writeLog('[readConfig] CONFIGFILE not exists, e: ' +  e + '.. returning null..')
        return null;
    }
}

//
// Process query args into Javascript object
//
function processQueryArgs(str) {
    var decodedQueryString = querystring.decode(str);
    // For dash.js-cmcd version differences
    var cmcdKey;
    if (str.includes('Common-Media-Client-Data'))
        cmcdKey = 'Common-Media-Client-Data';
    else cmcdKey = 'CMCD';

    var paramsArr = decodedQueryString[cmcdKey].split(',');
    var paramsObj = {};
    for (var i = 0; i < paramsArr.length; i++) {
        if (paramsArr[i].includes('=')) {
            var key = paramsArr[i].split('=')[0];
            var value = paramsArr[i].split('=')[1];
        }
        else {  // e.g. `bs` key does not have a value in CMCD query arg format
            var key = paramsArr[i];
            var value = 'true';
        }
        paramsObj[key] = value;
    }

    return paramsObj;
}

//
// Sample query: http://localhost:8080/cmsd-njs//media/vod/bbb_30fps_akamai/bbb_30fps.mpd?CMCD=bl%3D21300
//
function getResourceUsingSubrequestBBRD(r) {
    writeLog('');
    writeLog('### get resource from: ' + getOriginIdentifier());
    writeLog('### getResourceUsingSubrequestBBRD(r) triggered: ' + r.uri);
    // writeLog('.. args: ' + r.variables.args);

    // var dashObjUri = r.uri.split('/cmsd-njs/bufferBasedResponseDelay')[1];

    // Different parsing for BBRD compared to BBRC due to use of echo_sleep and echo_exec
    var dashObjUri = r.variables.args.split('/cmsd-njs/bufferBasedResponseDelay')[1].split('?')[0];
    var cmcdArgs = r.variables.args.split(dashObjUri + '?')[1].split(' ')[0];

    var paramsObj = processQueryArgs(cmcdArgs);

    writeLog("...paramsobj")
    writeLog(JSON.stringify(paramsObj))

    writeLog('.. dashObjUri: ' + dashObjUri)
    writeLog('.. cmcdArgs: ' + cmcdArgs)
    writeLog('.. r.variables.bufferBasedDelay: ' + r.variables.bufferBasedDelay)

    var staticResp = 'n=' + getOriginIdentifier() + ',';
    var dynamicResp = ('com.example-dl=' + r.variables.bufferBasedDelay);
    var overload = false;
    // set du flag in case of overload
    if (getServerLoad_intern() > OVERLOAD_THRESHOLD || getOverload_intern() == "true") {
        writeLog("Overload occured");
        dynamicResp += ",du";
        overload = true;
        //set du flag if client is new and it will lead to an overload
    } else if ((getServerLoad_intern() + LOAD_PER_CLIENT) > OVERLOAD_THRESHOLD && isClientNew(paramsObj['sid'])) {
        writeLog("Client could cause overload");
        dynamicResp += ",du";
    }

    cacheServerInfo(paramsObj, overload);

    //computing maximal client bitrate, based on the number of clients
    //doing it after caching in case values were changed
    var numc = getNumberOfClients_intern();
    if (numc == 0)
        numc = 1;
    var maxBitrate = SHARED_BANDWIDTH / numc;
    //storing the max bitrate value
    setMaxBitrate(maxBitrate);
    //providing the max bitrate value to the client
    dynamicResp += ",mb=" + parseInt(maxBitrate, 10).toString();

    //this CMCD values are used also in CMSD
    var cmcdValuesToTake = ["st", "ot", "sf", "v"]
    for (var value in cmcdValuesToTake) {
        if (cmcdValuesToTake[value] in paramsObj) {
            staticResp += (cmcdValuesToTake[value] + "=" + paramsObj[cmcdValuesToTake[value]] + ",")
        }
    }

    //sending a response
    function done(res) {
        r.headersOut['CMSD-Dynamic'] = dynamicResp;
        r.headersOut['CMSD-Static'] = staticResp;
        r.headersOut['Access-Control-Expose-Headers'] = ['CMSD-Dynamic', 'CMSD-Static'];
        r.return(res.status, res.responseBody);
    }

    // Retrieve requested Dash resource
    r.subrequest(dashObjUri, r.variables.args, done);

    r.finish();
}


//
// Triggered via bufferBasedResponseDelay.echo_sleep setting in nginx.conf
//
// Test queries -
// curl -i http://localhost:8080/cmsd-njs/bufferBasedResponseDelay/media/vod/bbb_30fps_akamai/bbb_30fps.mpd?CMCD=bl%3D21300%2Ccom.example-bmx%3D20000%2Ccom.example-bmn%3D5000%2Cot%3Dv%2Cbr%3D1000%2Cd%3D4000%2Cmtp%3D1000
//
function getBufferBasedDelay(r) {
    var metricsObj = {}
    metricsObj['timestamp'] = Math.round(new Date().getTime() / 1000);

    writeLog('');
    writeLog('### getBufferBasedDelay() triggered!');
    var paramsObj = processQueryArgs(r.variables.query_string);

    // If required args are not present in query, skip rate control
    if (!('bl' in paramsObj) || !('com.example-bmx' in paramsObj) || !('com.example-bmn' in paramsObj) || !('ot' in paramsObj) || !('br' in paramsObj) || !('d' in paramsObj) || !('mtp' in paramsObj)) {
        writeLog('Missing one or more required params, ignoring response delay..');
        writeLog(JSON.stringify(paramsObj))
        return 0;   // disables response delay
    }

    // If not video type, skip rate control
    if (paramsObj['ot'] != 'v' && paramsObj['ot'] != 'av') {
        writeLog('- object is not video type, ignoring rate limiting..');
        return 0;   // disables response delay
    }

    if ('sid' in paramsObj) {
        metricsObj['sid'] = paramsObj['sid'];
    } else {
        metricsObj['sid'] = -1;
    }

    if ('did' in paramsObj) {
        metricsObj['did'] = paramsObj['did'];
    } else {
        metricsObj['did'] = '-1';
    }

    var delay;
    var bMin = Number(paramsObj['com.example-bmn']);
    var bMax = Number(paramsObj['com.example-bmx']);

    writeLog('.. bMin = ' + bMin + '.. bMax = ' + bMax);
    metricsObj['bufferMin'] = bMin
    metricsObj['bufferMax'] = bMax

    var bufferLength;
    writeLog(".. metricsObj['did']: " + metricsObj['did']);
    writeLog(".. " + (metricsObj['did'].indexOf('dash.js-v4.2.1') > -1))
    if (metricsObj['did'].indexOf('dash.js-v4.2.1') > -1) {        // v4.2.1 uses ms; convert to s
        bufferLength = Number(paramsObj['bl']) / 1000;
    } else {                                               // v3.1.3 uses seconds
        bufferLength = Number(paramsObj['bl']);
    }
    writeLog('.. bl = ' + bufferLength)
    metricsObj['bufferLength'] = bufferLength;

    var nextBitrate = Number(paramsObj['br']);
    var segDuration = Number(paramsObj['d']) / 1000;    // convert ms to s
    var measuredTput = Number(paramsObj['mtp']);

    writeLog('.. nextBitrate = ' + nextBitrate + ', segDuration = ' + segDuration + ', measuredTput = ' + measuredTput);
    metricsObj['nextBitrate'] = nextBitrate
    metricsObj['segDuration'] = segDuration
    metricsObj['measuredTput'] = measuredTput

    // Retrieve $lastRecordedDelay in nginx.conf and compute delay to be applied
    var lastRecordedDelay = readConfig('lastRecordedDelay')
    if (lastRecordedDelay == null) lastRecordedDelay = 0
    var lastRecordedDelayTimestamp = readConfig('lastRecordedDelayTimestamp')
    if (lastRecordedDelayTimestamp == null) lastRecordedDelayTimestamp = 0

    writeLog('.. lastRecordedDelay = ' + lastRecordedDelay + 's, lastRecordedDelayTimestamp = ' + lastRecordedDelayTimestamp + 's');
    metricsObj['lastRecordedDelay'] = lastRecordedDelay
    metricsObj['lastRecordedDelayTimestamp'] = lastRecordedDelayTimestamp

    // Compute current delay after taking into account time passed
    var currentTimestamp = Math.round(new Date().getTime() / 1000);
    var timePassed = currentTimestamp - lastRecordedDelayTimestamp;
    var currentDelay = Math.max(0, (lastRecordedDelay - timePassed));

    writeLog('.. currentDelay = ' + currentDelay + 's');
    metricsObj['currentDelay'] = currentDelay

    var expectedSegDownloadTime = (nextBitrate * segDuration) / measuredTput;
    var expectedBufferLengthAfterDelayedDownload = Math.max(0, bufferLength - expectedSegDownloadTime - currentDelay);

    writeLog('.. expectedSegDownloadTime = ' + expectedSegDownloadTime + 's, expectedBufferLengthAfterDelayedDownload = ' + expectedBufferLengthAfterDelayedDownload + 's');
    metricsObj['expectedSegDownloadTime'] = expectedSegDownloadTime
    metricsObj['expectedBufferLengthAfterDelayedDownload'] = expectedBufferLengthAfterDelayedDownload

    //
    // Case 1: Client is critical; update $lastRecordedDelay in nginx.conf and return delay=0 for this client
    // ($lastRecordedDelay will be retrieved by all other non-critical clients)
    //
    if (bufferLength < bMin) {
        writeLog('[case1] Critical client found !!');
        metricsObj['case'] = '1-critical'

        // var segSize = nextBitrate * segDuration;
        // var newDelay = segSize / measuredTput;  // Computed as expected segment download duration
        var newDelay = expectedSegDownloadTime;

        writeLog('.. newDelay = ' + newDelay + ', currentDelay = ' + currentDelay);
        if (newDelay > currentDelay) {
            writeConfig('lastRecordedDelay', newDelay);     // Update $lastRecordedDelay in config file
            writeConfig('lastRecordedDelayTimestamp', currentTimestamp);

            writeLog('.. updated $lastRecordedDelay = ' + newDelay);
            metricsObj['delayUpdateToConfig'] = newDelay    // Add to metrics logging file
            metricsObj['delayTimestampUpdateToConfig'] = currentTimestamp
        }

        delay = 0   // Impt to set this critical client's request to delay=0
    }

    if (!'delayUpdateToConfig' in metricsObj) {
        writeLog('.. no update to $lastRecordedDelay')
        metricsObj['delayUpdateToConfig'] = -1          // Add to metrics logging file
        metricsObj['delayTimestampUpdateToConfig'] = -1
    }

    //
    // Case 2: Client is in surplus; apply delay
    //
    else if (bufferLength > bMax) {
        writeLog('[case2] Surplus client found, bufferLength: ' + bufferLength);
        metricsObj['case'] = '2-surplus'
        metricsObj['delayUpdateToConfig'] = -1
        // else if (expectedBufferLengthAfterDelayedDownload > bMax) {
        //     writeLog('[case2] Surplus client found, expectedBufferLengthAfterDelayedDownload: ' + expectedBufferLengthAfterDelayedDownload);
        delay = Math.max(0, currentDelay);
    }

    // Case 3: All other (normal) clients [bMin, bMax]; apply delay
    else {
        writeLog('[case3] Normal client found, bufferLength: ' + bufferLength);
        metricsObj['case'] = '3-normal'
        metricsObj['delayUpdateToConfig'] = -1
        // else if (expectedBufferLengthAfterDelayedDownload >= bMin) {
        //     writeLog('[case3] Normal client found, expectedBufferLengthAfterDelayedDownload: ' + expectedBufferLengthAfterDelayedDownload);
        // delay = 0.5 * currentDelay;

        var bRange = bMax - bMin;
        delay = Math.max(0, Math.round((((bufferLength - bMin) / bRange) * currentDelay), 2));
    }

    writeLog('Serving current client with delay = ' + delay + ' s!');
    metricsObj['delayForThisReq'] = delay

    writeCsv(metricsObj);

    return delay;
}

// curl -v http://localhost:8080/getServerLoad
function getServerLoad(r) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        r.return(200, 'Load from ' + jsonObj.identifier + ' is at ' + parseInt(jsonObj.current_load) + parseInt(jsonObj.additional_load) + '%\n');
    } catch (e) {
        r.return(500, e + '\n');
    }
}

function getServerLoad_intern() {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        //absolute server load is sum of client load and user-defined additional load
        return parseInt(jsonObj.current_load) + parseInt(jsonObj.additional_load);
    } catch (e) {
        return e;
    }
}

function getOriginIdentifier() {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        return jsonObj.identifier;
    } catch (e) {
        return e;
    }
}

// curl -v http://localhost:8080/getClients
function getNumberOfClients(r) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        r.return(200, 'Current number of connected clients at ' + jsonObj.identifier + ': ' + jsonObj.numOfClients + '\n');
        // return jsonObj.numOfClients;
    } catch (e) {
        r.return(500, e + '\n');
    }
}

function getNumberOfClients_intern() {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        return jsonObj.activeSessions.length;
    } catch (e) {
        // r.return(500, e + '\n');
        return e;
    }
}

//checks if the session id sid is in servers active sessions
function isClientNew(sid) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        var sid2 = sid.replace(/"/g, "");
        return !jsonObj.activeSessions.includes(sid2);
    } catch (e) {
        // r.return(500, e + '\n');
        return e;
    }
}

// handle server info: load, sessions, number of clients
function cacheServerInfo(paramsObj, overload) {
    var sid = ''
    if ('sid' in paramsObj) {
        sid = paramsObj['sid'];
    }

    // cut "" from string
    var sid2 = sid.replace(/"/g, "");

    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
    } catch (e) {
    }

    // if a new client wants to connect with the server and the server is not overloaded, cache sid
    //if adding of this client will lead to an overload, server will not add it to active sessions
    if (!jsonObj.activeSessions.includes(sid2) && !overload && ((parseInt(jsonObj.current_load) + LOAD_PER_CLIENT) <= OVERLOAD_THRESHOLD)) {
        jsonObj.activeSessions.push(sid2);
        // if client is connected and server sends overload flag, delete sid (also send du flag in getResourceUsingSubrequestBBRD)
    } else if (jsonObj.activeSessions.includes(sid2) && overload) {
        const index = jsonObj.activeSessions.indexOf(sid2);
        jsonObj.activeSessions.splice(index, 1);
    }


    // set number of clients
    jsonObj.numOfClients = jsonObj.activeSessions.length;

    // set server load
    jsonObj.current_load = (jsonObj.numOfClients * LOAD_PER_CLIENT).toString();

    try {
        fs.writeFileSync(SERVER1INFO, JSON.stringify(jsonObj));
    } catch (e) {
    }
}

//sets all server key-parameters to default value
function resetSessions(r) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
    } catch (e) {
    }

    jsonObj.activeSessions = [];
    jsonObj.current_load = "0";
    jsonObj.numOfClients = 0;
    jsonObj.overload = "false";
    jsonObj.maxBitrate = 9000;
    jsonObj.additional_load = 0;

    try {
        fs.writeFileSync(SERVER1INFO, JSON.stringify(jsonObj));
        r.return(200, 'Reset active sessions on ' + jsonObj.identifier + '\n');
    } catch (e) {
    }
}

// curl -v http://localhost:8080/getServerInfo
function getServerInfo(r) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        r.return(200, jsonStr);
    } catch (e) {
        r.return(500, e + '\n');
    }
}

// curl -v http://localhost:8080/getOverload
function getOverload(r) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        r.return(200, 'Overload' + jsonObj.identifier + ': ' + jsonObj.overload + '\n');
    } catch (e) {
        r.return(500, e + '\n');
    }
}

function getOverload_intern() {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
        return jsonObj.overload;
    } catch (e) {
        return e;
    }
}

//allow to directly set maximal bitrate for the (all) clients on the server
function setMaxBitrate(bitrate) {
    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
    } catch (e) {
    }
    jsonObj.maxBitrate = parseInt(bitrate, 10);

    try {
        fs.writeFileSync(SERVER1INFO, JSON.stringify(jsonObj));
    } catch (e) {
    }
}

// purpose of this function is to show server switching from client in chrome and to show that the video continues loading where it left off on the other server
// e.g. set true: curl -v --header "overload: true" http://localhost:8080/setoOverload -> after that client will switch server
function setOverload(r) {
    var overload = r.headersIn.overload;

    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
    } catch (e) {
        r.return(500, e + '\n');
    }

    jsonObj.overload = overload;

    try {
        fs.writeFileSync(SERVER1INFO, JSON.stringify(jsonObj));
        r.return(200, 'Overload from ' + jsonObj.identifier + ' set to: ' + overload + '\n');
    } catch (e) {
    }
}

//this function allows to increase the server load by external user-specified value
//this value will be summarized with load of clients
//curl -v --header "load: 20" http://localhost:8080/setoOverload
function setAdditionalLoad(r) {
    var load = r.headersIn.load;

    try {
        var jsonStr = fs.readFileSync(SERVER1INFO);
        var jsonObj = JSON.parse(jsonStr);
    } catch (e) {
        r.return(500, e + '\n');
    }

    jsonObj.additional_load = load;

    try {
        fs.writeFileSync(SERVER1INFO, JSON.stringify(jsonObj));
        r.return(200, 'Additional load from ' + jsonObj.identifier + ' set to: ' + load + '\n');
    } catch (e) {
    }
}

// Note: We need to add the function to nginx.conf file too for HTTP access
export default {
    getResourceUsingSubrequestBBRD, getBufferBasedDelay, getServerLoad, getNumberOfClients, resetSessions,
    getServerInfo, setOverload, getOverload, setAdditionalLoad
};